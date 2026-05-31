// Подключение к PostgreSQL через pool
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('[ERROR] Неожиданная ошибка pg pool:', err);
});

/**
 * Выполнить запрос на свободном клиенте из пула.
 * @param {string} text SQL
 * @param {Array} params параметры
 */
async function query(text, params) {
  return pool.query(text, params);
}

/**
 * Выполнить набор запросов в одной транзакции.
 * Колбэк получает клиента; BEGIN/COMMIT/ROLLBACK делаются автоматически.
 * @param {(client: import('pg').PoolClient) => Promise<any>} callback
 */
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
