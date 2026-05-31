// Подключение к PostgreSQL через pool
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

/**
 * Определить настройку SSL.
 * Railway внутренний хост (*.railway.internal) и локальная БД — без SSL,
 * публичный хост (Railway proxy и т.п.) — с SSL.
 * Можно принудительно задать через DATABASE_SSL=true|false.
 */
function sslConfig() {
  const url = process.env.DATABASE_URL || '';
  if (process.env.DATABASE_SSL === 'false') return false;
  if (process.env.DATABASE_SSL === 'true') return { rejectUnauthorized: false };
  if (
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    url.includes('.railway.internal')
  ) {
    return false;
  }
  return { rejectUnauthorized: false };
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig(),
});

pool.on('error', (err) => {
  console.error('[ERROR] Неожиданная ошибка pg pool:', err);
});

/**
 * Применить db/schema.sql (идемпотентно, CREATE TABLE IF NOT EXISTS).
 * Вызывается при старте, чтобы на свежей БД Railway появились таблицы.
 */
async function migrate() {
  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(sql);
  console.log('[INFO] Схема БД проверена/применена');
}

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

module.exports = { pool, query, withTransaction, migrate };
