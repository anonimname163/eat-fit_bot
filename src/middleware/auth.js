// Проверка роли пользователя перед выполнением handler'а.
const db = require('../db');

/** Список telegram_id админов из .env. */
function adminIds() {
  return (process.env.ADMIN_TELEGRAM_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Является ли telegram_id админом по .env. */
function isEnvAdmin(telegramId) {
  return adminIds().includes(String(telegramId));
}

/**
 * Вернуть эффективную роль пользователя.
 * Если telegram_id в ADMIN_TELEGRAM_IDS — всегда 'admin'.
 * @param {object|null} client
 * @param {number} telegramId
 */
function effectiveRole(client, telegramId) {
  if (isEnvAdmin(telegramId)) return 'admin';
  return client ? client.role : 'client';
}

/**
 * Проверить, что у клиента одна из требуемых ролей.
 * @param {object|null} client
 * @param {number} telegramId
 * @param {string[]} roles допустимые роли
 */
function hasRole(client, telegramId, roles) {
  const role = effectiveRole(client, telegramId);
  return roles.includes(role);
}

/**
 * Синхронизировать роль admin из .env в БД (один раз при /start).
 * @param {number} telegramId
 */
async function syncAdminRole(telegramId) {
  if (!isEnvAdmin(telegramId)) return;
  await db.query(
    `UPDATE clients SET role = 'admin' WHERE telegram_id = $1 AND role <> 'admin'`,
    [telegramId]
  );
}

module.exports = { adminIds, isEnvAdmin, effectiveRole, hasRole, syncAdminRole };
