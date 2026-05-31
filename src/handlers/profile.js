// Профиль клиента и баланс.
const { t, formatMoney } = require('../i18n');

/** Показать профиль. */
async function showProfile(bot, chatId, client) {
  const lang = client.language || 'ru';
  const lines = [
    `*${t(lang, 'profile_title')}*`,
    '',
    `${t(lang, 'profile_name')}: ${client.first_name || ''} ${client.last_name || ''}`.trim(),
    `${t(lang, 'profile_phone')}: ${client.phone || '-'}`,
    `${t(lang, 'profile_address')}: ${client.address || '-'}`,
    `${t(lang, 'profile_balance')}: ${formatMoney(client.balance)} ${t(lang, 'currency')}`,
  ];
  await bot.sendMessage(chatId, lines.join('\n'), { parse_mode: 'Markdown' });
}

/** Показать баланс. */
async function showBalance(bot, chatId, client) {
  const lang = client.language || 'ru';
  const text = `${t(lang, 'balance_title')}: *${formatMoney(client.balance)} ${t(lang, 'currency')}*`;
  await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

module.exports = { showProfile, showBalance };
