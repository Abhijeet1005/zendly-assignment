const db = require('../config/database');

class InboxRepository {
  async create(tenantId, phoneNumber, displayName) {
    const query = `INSERT INTO inboxes (tenant_id, phone_number, display_name) VALUES (?, ?, ?)`;
    const result = await db.query(query, [tenantId, phoneNumber, displayName]);
    const [rows] = await db.query('SELECT * FROM inboxes WHERE id = ?', [result.rows.insertId]);
    return rows[0];
  }

  async findById(id) {
    const query = 'SELECT * FROM inboxes WHERE id = ?';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async findByTenant(tenantId) {
    const query = 'SELECT * FROM inboxes WHERE tenant_id = ? ORDER BY created_at DESC';
    const result = await db.query(query, [tenantId]);
    return result.rows;
  }

  async findByPhoneNumber(tenantId, phoneNumber) {
    const query = 'SELECT * FROM inboxes WHERE tenant_id = ? AND phone_number = ?';
    const result = await db.query(query, [tenantId, phoneNumber]);
    return result.rows[0];
  }

  async update(id, displayName) {
    const query = `UPDATE inboxes SET display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await db.query(query, [displayName, id]);
    const result = await db.query('SELECT * FROM inboxes WHERE id = ?', [id]);
    return result.rows[0];
  }

  async findByOperator(operatorId) {
    const query = `
      SELECT i.* 
      FROM inboxes i
      INNER JOIN operator_inbox_subscriptions ois ON i.id = ois.inbox_id
      WHERE ois.operator_id = ?
      ORDER BY i.created_at DESC
    `;
    const result = await db.query(query, [operatorId]);
    return result.rows;
  }
}

module.exports = new InboxRepository();
