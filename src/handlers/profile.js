// Профиль клиента и баланс.
const { t, formatMoney, esc } = require('../i18n');

/** Показать профиль. */
async function showProfile(bot, chatId, client) {
  const lang = client.language || 'ru';
  const lines = [
    `<b>${esc(t(lang, 'profile_title'))}</b>`,
    '',
    esc(`${t(lang, 'profile_name')}: ${client.first_name || ''} ${client.last_name || ''}`.trim()),
    `${esc(t(lang, 'profile_phone'))}: ${esc(client.phone || '-')}`,
    `${esc(t(lang, 'profile_address'))}: ${esc(client.address || '-')}`,
    `${esc(t(lang, 'profile_balance'))}: ${esc(formatMoney(client.balance))} ${esc(t(lang, 'currency'))}`,
  ];
  await bot.sendMessage(chatId, lines.join('\n'), { parse_mode: 'HTML' });
}

/** Показать баланс. */
async function showBalance(bot, chatId, client) {
  const lang = client.language || 'ru';
  const text = `${esc(t(lang, 'balance_title'))}: <b>${esc(formatMoney(client.balance))} ${esc(t(lang, 'currency'))}</b>`;
  await bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
}

module.exports = { showProfile, showBalance };
