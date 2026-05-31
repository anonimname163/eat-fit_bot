// Применить db/schema.sql к базе из DATABASE_URL.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function main() {
  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(sql);
    console.log('[INFO] Схема БД применена успешно');
  } catch (err) {
    console.error('[ERROR] Не удалось применить схему:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
