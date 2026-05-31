// Хранилище настроек приложения (ключ/значение) в таблице app_settings.
const db = require('./db');

// Ключи настроек
const KEYS = {
  TOPUP_TELEGRAM: 'topup_telegram',
  TOPUP_PHONE: 'topup_phone',
};

/** Получить значение настройки (или дефолт). */
async function getSetting(key, def = null) {
  const { rows } = await db.query('SELECT value FROM app_settings WHERE key = $1', [key]);
  return rows.length ? rows[0].value : def;
}

/** Сохранить значение настройки (upsert). */
async function setSetting(key, value) {
  await db.query(
    `INSERT INTO app_settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, value]
  );
}

module.exports = { KEYS, getSetting, setSetting };
