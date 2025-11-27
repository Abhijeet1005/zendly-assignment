const db = require('../config/database');

class LabelRepository {
  async create(tenantId, inboxId, name, color, createdBy) {
    const query = `
      INSERT INTO labels (tenant_id, inbox_id, name, color, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await db.query(query, [tenantId, inboxId, name, color, createdBy]);
    return result.rows[0];
  }

  async findById(id) {
    const query = 'SELECT * FROM labels WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async findByInbox(inboxId) {
    const query = 'SELECT * FROM labels WHERE inbox_id = $1 ORDER BY created_at DESC';
    const result = await db.query(query, [inboxId]);
    return result.rows;
  }

  async update(id, name, color) {
    const query = `
      UPDATE labels 
      SET name = $1, color = $2
      WHERE id = $3
      RETURNING *
    `;
    const result = await db.query(query, [name, color, id]);
    return result.rows[0];
  }

  async delete(id) {
    const query = 'DELETE FROM labels WHERE id = $1';
    await db.query(query, [id]);
  }

  async attachToConversation(conversationId, labelId) {
    const query = `
      INSERT INTO conversation_labels (conversation_id, label_id)
      VALUES ($1, $2)
      ON CONFLICT (conversation_id, label_id) DO NOTHING
      RETURNING *
    `;
    const result = await db.query(query, [conversationId, labelId]);
    return result.rows[0];
  }

  async detachFromConversation(conversationId, labelId) {
    const query = `
      DELETE FROM conversation_labels
      WHERE conversation_id = $1 AND label_id = $2
    `;
    await db.query(query, [conversationId, labelId]);
  }

  async findByConversation(conversationId) {
    const query = `
      SELECT l.* 
      FROM labels l
      INNER JOIN conversation_labels cl ON l.id = cl.label_id
      WHERE cl.conversation_id = $1
    `;
    const result = await db.query(query, [conversationId]);
    return result.rows;
  }
}

module.exports = new LabelRepository();
