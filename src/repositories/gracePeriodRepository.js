const db = require('../config/database');

class GracePeriodRepository {
  async create(conversationId, operatorId, expiresAt, reason) {
    const query = `
      INSERT INTO grace_period_assignments (conversation_id, operator_id, expires_at, reason)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (conversation_id) DO NOTHING
      RETURNING *
    `;
    const result = await db.query(query, [conversationId, operatorId, expiresAt, reason]);
    return result.rows[0];
  }

  async findByOperator(operatorId) {
    const query = `
      SELECT * FROM grace_period_assignments 
      WHERE operator_id = $1
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
    const query = 'DELETE FROM grace_period_assignments WHERE operator_id = $1';
    await db.query(query, [operatorId]);
  }

  async deleteByConversation(conversationId) {
    const query = 'DELETE FROM grace_period_assignments WHERE conversation_id = $1';
    await db.query(query, [conversationId]);
  }

  async delete(id) {
    const query = 'DELETE FROM grace_period_assignments WHERE id = $1';
    await db.query(query, [id]);
  }

  async findByConversation(conversationId) {
    const query = 'SELECT * FROM grace_period_assignments WHERE conversation_id = $1';
    const result = await db.query(query, [conversationId]);
    return result.rows[0];
  }
}

module.exports = new GracePeriodRepository();
