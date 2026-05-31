// Проверка: зарегистрирован ли пользователь (есть запись в clients
// с заполненными именем/телефоном/адресом).
const db = require('../db');

/**
 * Вернуть клиента по telegram_id или null.
 * @param {number} telegramId
 */
async function getClient(telegramId) {
  const { rows } = await db.query(
    'SELECT * FROM clients WHERE telegram_id = $1',
    [telegramId]
  );
  return rows.length ? rows[0] : null;
}

/**
 * Считается ли регистрация завершённой.
 * @param {object|null} client
 */
function isRegistered(client) {
  return Boolean(
    client && client.first_name && client.phone && client.address
  );
}

module.exports = { getClient, isRegistered };
