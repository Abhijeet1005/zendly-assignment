const db = require('../config/database');

class OperatorRepository {
  async create(tenantId, role) {
    const query = `INSERT INTO operators (tenant_id, role) VALUES (?, ?)`;
    const result = await db.query(query, [tenantId, role]);
    const [rows] = await db.query('SELECT * FROM operators WHERE id = ?', [result.rows.insertId]);
    return rows[0];
  }

  async findById(id) {
    const query = 'SELECT * FROM operators WHERE id = ?';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async findByTenant(tenantId) {
    const query = 'SELECT * FROM operators WHERE tenant_id = ? ORDER BY created_at DESC';
    const result = await db.query(query, [tenantId]);
    return result.rows;
  }

  async updateRole(id, role) {
    const query = `UPDATE operators SET role = ? WHERE id = ?`;
    await db.query(query, [role, id]);
    const result = await db.query('SELECT * FROM operators WHERE id = ?', [id]);
    return result.rows[0];
  }

  async getStatus(operatorId) {
    const query = 'SELECT * FROM operator_status WHERE operator_id = ?';
    const result = await db.query(query, [operatorId]);
    return result.rows[0];
  }

  async upsertStatus(operatorId, status) {
    const query = `
      INSERT INTO operator_status (operator_id, status, last_status_change_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE status = ?, last_status_change_at = CURRENT_TIMESTAMP
    `;
    await db.query(query, [operatorId, status, status]);
    const result = await db.query('SELECT * FROM operator_status WHERE operator_id = ?', [operatorId]);
    return result.rows[0];
  }

  async subscribe(operatorId, inboxId) {
    const query = `
      INSERT IGNORE INTO operator_inbox_subscriptions (operator_id, inbox_id)
      VALUES (?, ?)
    `;
    await db.query(query, [operatorId, inboxId]);
    const result = await db.query('SELECT * FROM operator_inbox_subscriptions WHERE operator_id = ? AND inbox_id = ?', [operatorId, inboxId]);
    return result.rows[0];
  }

  async unsubscribe(operatorId, inboxId) {
    const query = `DELETE FROM operator_inbox_subscriptions WHERE operator_id = ? AND inbox_id = ?`;
    await db.query(query, [operatorId, inboxId]);
  }

  async getSubscriptions(operatorId) {
    const query = `SELECT inbox_id FROM operator_inbox_subscriptions WHERE operator_id = ?`;
    const result = await db.query(query, [operatorId]);
    return result.rows.map(row => row.inbox_id);
  }
}

module.exports = new OperatorRepository();
