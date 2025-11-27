const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_MAX) || 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

async function query(text, params) {
  const start = Date.now();
  try {
    const [rows] = await pool.execute(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: Array.isArray(rows) ? rows.length : 0 });
    return { rows };
  } catch (error) {
    logger.error('Query error', { text, error: error.message });
    throw error;
  }
}

async function getClient() {
  return await pool.getConnection();
}

async function checkConnection() {
  try {
    await pool.execute('SELECT 1');
    return true;
  } catch (error) {
    logger.error('Database connection check failed', { error: error.message });
    return false;
  }
}

module.exports = {
  query,
  getClient,
  pool,
  checkConnection
};
