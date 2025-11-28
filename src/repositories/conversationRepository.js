const db = require('../config/database');

class ConversationRepository {
  async create(data) {
    const query = `
      INSERT INTO conversations (
        tenant_id, inbox_id, external_conversation_id, customer_phone_number,
        state, last_message_at, message_count
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await db.query(query, [
      data.tenantId,
      data.inboxId,
      data.externalConversationId,
      data.customerPhoneNumber,
      data.state || 'QUEUED',
      data.lastMessageAt,
      data.messageCount || 0
    ]);
    const [rows] = await db.query('SELECT * FROM conversations WHERE id = ?', [result.rows.insertId]);
    return rows[0];
  }

  async findById(id) {
    const query = 'SELECT * FROM conversations WHERE id = ?';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async findByExternalId(tenantId, externalConversationId) {
    const query = `SELECT * FROM conversations WHERE tenant_id = ? AND external_conversation_id = ?`;
    const result = await db.query(query, [tenantId, externalConversationId]);
    return result.rows[0];
  }

  async findByState(state, limit = 100) {
    const query = `SELECT * FROM conversations WHERE state = ? ORDER BY created_at DESC LIMIT ?`;
    const result = await db.query(query, [state, limit]);
    return result.rows;
  }

  async findByInbox(inboxId, filters = {}, limit = 100, offset = 0) {
    let query = 'SELECT * FROM conversations WHERE inbox_id = ?';
    const params = [inboxId];

    if (filters.state) {
      query += ` AND state = ?`;
      params.push(filters.state);
    }

    if (filters.assignedOperatorId) {
      query += ` AND assigned_operator_id = ?`;
      params.push(filters.assignedOperatorId);
    }

    if (filters.labelId) {
      query += ` AND id IN (SELECT conversation_id FROM conversation_labels WHERE label_id = ?)`;
      params.push(filters.labelId);
    }

    // Sorting
    if (filters.sort === 'oldest') {
      query += ' ORDER BY created_at ASC';
    } else if (filters.sort === 'priority') {
      query += ' ORDER BY priority_score DESC, last_message_at ASC';
    } else {
      query += ' ORDER BY created_at DESC';
    }

    query += ` LIMIT ? OFFSET ?`;
    // Ensure limit and offset are valid integers
    const validLimit = parseInt(limit) || 100;
    const validOffset = parseInt(offset) || 0;
    params.push(validLimit, validOffset);

    const result = await db.query(query, params);
    return result.rows;
  }

  async findByOperator(operatorId, limit = 100) {
    const query = `SELECT * FROM conversations WHERE assigned_operator_id = ? ORDER BY updated_at DESC LIMIT ?`;
    const result = await db.query(query, [operatorId, limit]);
    return result.rows;
  }

  async search(phoneNumber, inboxIds, limit = 100) {
    const placeholders = inboxIds.map(() => '?').join(',');
    const query = `
      SELECT * FROM conversations 
      WHERE customer_phone_number = ? AND inbox_id IN (${placeholders})
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const result = await db.query(query, [phoneNumber, ...inboxIds, limit]);
    return result.rows;
  }

  async update(id, updates) {
    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      fields.push(`${this._toSnakeCase(key)} = ?`);
      values.push(updates[key]);
    });

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE conversations SET ${fields.join(', ')} WHERE id = ?`;
    await db.query(query, values);
    
    const result = await db.query('SELECT * FROM conversations WHERE id = ?', [id]);
    return result.rows[0];
  }

  async updateState(id, state, additionalUpdates = {}) {
    const updates = { state, ...additionalUpdates };
    return this.update(id, updates);
  }

  async lockAndUpdate(client, id, updates) {
    // Lock the row
    const lockQuery = 'SELECT * FROM conversations WHERE id = ? FOR UPDATE';
    const [lockResult] = await client.execute(lockQuery, [id]);
    
    if (lockResult.length === 0) {
      return null;
    }

    // Update the row
    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      fields.push(`${this._toSnakeCase(key)} = ?`);
      values.push(updates[key]);
    });

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateQuery = `UPDATE conversations SET ${fields.join(', ')} WHERE id = ?`;
    await client.execute(updateQuery, values);
    
    // Fetch updated row
    const [result] = await client.execute('SELECT * FROM conversations WHERE id = ?', [id]);
    return result[0];
  }

  async findQueuedByInboxes(inboxIds, limit = 100) {
    const placeholders = inboxIds.map(() => '?').join(',');
    const query = `
      SELECT * FROM conversations 
      WHERE state = 'QUEUED' AND inbox_id IN (${placeholders})
      ORDER BY priority_score DESC, last_message_at ASC
      LIMIT ?
    `;
    const result = await db.query(query, [...inboxIds, limit]);
    return result.rows;
  }

  async findAllocatedByOperator(operatorId) {
    const query = `SELECT * FROM conversations WHERE state = 'ALLOCATED' AND assigned_operator_id = ?`;
    const result = await db.query(query, [operatorId]);
    return result.rows;
  }

  _toSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

module.exports = new ConversationRepository();
