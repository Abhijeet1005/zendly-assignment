const db = require('../config/database');

class GracePeriodRepository {
  async create(conversationId, operatorId, expiresAt, reason) {
    const query = `
      INSERT IGNORE INTO grace_period_assignments (conversation_id, operator_id, expires_at, reason)
      VALUES (?, ?, ?, ?)
    `;
    await db.query(query, [conversationId, operatorId, expiresAt, reason]);
    const result = await db.query('SELECT * FROM grace_period_assignments WHERE conversation_id = ?', [conversationId]);
    return result.rows[0];
  }

  async findByOperator(operatorId) {
    const query = `
      SELECT * FROM grace_period_assignments 
      WHERE operator_id = ?
      ORDER BY expires_at ASC
    `;
    const result = await db.query(query, [operatorId]);
    return result.rows;
  }

  async findExpired() {
    const query = `
      SELECT * FROM grace_period_assignments 
      WHERE expires_at <= CURRENT_TIMESTAMP
      ORDER BY expires_at ASC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  async deleteByOperator(operatorId) {
    const query = 'DELETE FROM grace_period_assignments WHERE operator_id = ?';
    await db.query(query, [operatorId]);
  }

  async deleteByConversation(conversationId) {
    const query = 'DELETE FROM grace_period_assignments WHERE conversation_id = ?';
    await db.query(query, [conversationId]);
  }

  async delete(id) {
    const query = 'DELETE FROM grace_period_assignments WHERE id = ?';
    await db.query(query, [id]);
  }

  async findByConversation(conversationId) {
    const query = 'SELECT * FROM grace_period_assignments WHERE conversation_id = ?';
    const result = await db.query(query, [conversationId]);
    return result.rows[0];
  }
}

module.exports = new GracePeriodRepository();
