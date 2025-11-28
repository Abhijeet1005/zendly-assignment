const db = require('../config/database');

class LabelRepository {
  async create(tenantId, inboxId, name, color, createdBy) {
    const query = `
      INSERT INTO labels (tenant_id, inbox_id, name, color, created_by)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await db.query(query, [tenantId, inboxId, name, color, createdBy]);
    const [rows] = await db.query('SELECT * FROM labels WHERE id = ?', [result.rows.insertId]);
    return rows[0];
  }

  async findById(id) {
    const query = 'SELECT * FROM labels WHERE id = ?';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async findByInbox(inboxId) {
    const query = 'SELECT * FROM labels WHERE inbox_id = ? ORDER BY created_at DESC';
    const result = await db.query(query, [inboxId]);
    return result.rows;
  }

  async update(id, name, color) {
    const query = `UPDATE labels SET name = ?, color = ? WHERE id = ?`;
    await db.query(query, [name, color, id]);
    const result = await db.query('SELECT * FROM labels WHERE id = ?', [id]);
    return result.rows[0];
  }

  async delete(id) {
    const query = 'DELETE FROM labels WHERE id = ?';
    await db.query(query, [id]);
  }

  async attachToConversation(conversationId, labelId) {
    const query = `
      INSERT IGNORE INTO conversation_labels (conversation_id, label_id)
      VALUES (?, ?)
    `;
    await db.query(query, [conversationId, labelId]);
    const result = await db.query('SELECT * FROM conversation_labels WHERE conversation_id = ? AND label_id = ?', [conversationId, labelId]);
    return result.rows[0];
  }

  async detachFromConversation(conversationId, labelId) {
    const query = `DELETE FROM conversation_labels WHERE conversation_id = ? AND label_id = ?`;
    await db.query(query, [conversationId, labelId]);
  }

  async findByConversation(conversationId) {
    const query = `
      SELECT l.* 
      FROM labels l
      INNER JOIN conversation_labels cl ON l.id = cl.label_id
      WHERE cl.conversation_id = ?
    `;
    const result = await db.query(query, [conversationId]);
    return result.rows;
  }
}

module.exports = new LabelRepository();
