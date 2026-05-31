// Профиль клиента, баланс и редактирование профиля.
const db = require('../db');
const { t, formatMoney, esc } = require('../i18n');
const state = require('../state');
const kb = require('../keyboards');
const { getClient } = require('../middleware/registration');

/** Показать профиль с кнопкой редактирования. */
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
  await bot.sendMessage(chatId, lines.join('\n'), {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[{ text: t(lang, 'btn_edit_profile'), callback_data: 'profile:edit' }]],
    },
  });
}

/** Показать баланс. */
async function showBalance(bot, chatId, client) {
  const lang = client.language || 'ru';
  const text = `${esc(t(lang, 'balance_title'))}: <b>${esc(formatMoney(client.balance))} ${esc(t(lang, 'currency'))}</b>`;
  await bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
}

/** Меню выбора, какое поле профиля редактировать (callback profile:edit). */
async function showEditProfile(bot, query, client) {
  const lang = client.language || 'ru';
  await bot.answerCallbackQuery(query.id);
  await bot.sendMessage(query.message.chat.id, t(lang, 'profile_choose_field'), {
    reply_markup: {
      inline_keyboard: [
        [{ text: t(lang, 'pf_name'), callback_data: 'profile:field:name' }],
        [{ text: t(lang, 'pf_phone'), callback_data: 'profile:field:phone' }],
        [{ text: t(lang, 'pf_address'), callback_data: 'profile:field:address' }],
        [{ text: t(lang, 'pf_language'), callback_data: 'profile:field:language' }],
      ],
    },
  });
}

/** Начать редактирование выбранного поля (callback profile:field:<f>). */
async function startProfileField(bot, query, client) {
  const lang = client.language || 'ru';
  const chatId = query.message.chat.id;
  const telegramId = query.from.id;
  const field = query.data.split(':')[2];
  await bot.answerCallbackQuery(query.id);

  if (field === 'language') {
    // Смену языка обрабатывает существующий lang:* колбэк
    await bot.sendMessage(chatId, t(lang, 'choose_language'), kb.languageKeyboard());
    return;
  }
  if (field === 'name') {
    state.setSession(telegramId, 'edit_profile', 'name', {});
    await bot.sendMessage(chatId, t(lang, 'profile_ask_name'), { reply_markup: { remove_keyboard: true } });
    return;
  }
  if (field === 'phone') {
    state.setSession(telegramId, 'edit_profile', 'phone', {});
    await bot.sendMessage(chatId, t(lang, 'profile_ask_phone'), kb.shareContactKeyboard(lang));
    return;
  }
  if (field === 'address') {
    state.setSession(telegramId, 'edit_profile', 'address', {});
    await bot.sendMessage(chatId, t(lang, 'profile_ask_address'), { reply_markup: { remove_keyboard: true } });
    return;
  }
}

/** Шаг ввода нового значения поля профиля. Возвращает true если обработано. */
async function handleProfileEditStep(bot, msg) {
  const telegramId = msg.from.id;
  const chatId = msg.chat.id;
  const session = state.getSession(telegramId);
  if (!session || session.flow !== 'edit_profile') return false;

  const client = await getClient(telegramId);
  const lang = (client && client.language) || 'ru';

  if (session.step === 'name') {
    const fullName = (msg.text || '').trim().replace(/\s+/g, ' ');
    if (!fullName) return true;
    const [firstName, ...rest] = fullName.split(' ');
    const lastName = rest.join(' ') || null;
    await db.query('UPDATE clients SET first_name = $1, last_name = $2 WHERE telegram_id = $3', [firstName, lastName, telegramId]);
  } else if (session.step === 'phone') {
    let phone = null;
    if (msg.contact && msg.contact.phone_number) phone = msg.contact.phone_number;
    else if (msg.text) {
      const cleaned = msg.text.replace(/[^\d+]/g, '');
      if (cleaned.replace(/\D/g, '').length >= 7) phone = cleaned;
    }
    if (!phone) {
      await bot.sendMessage(chatId, t(lang, 'invalid_phone'), kb.shareContactKeyboard(lang));
      return true;
    }
    await db.query('UPDATE clients SET phone = $1 WHERE telegram_id = $2', [phone, telegramId]);
  } else if (session.step === 'address') {
    const address = (msg.text || '').trim();
    if (!address) return true;
    await db.query('UPDATE clients SET address = $1 WHERE telegram_id = $2', [address, telegramId]);
  } else {
    state.clearSession(telegramId);
    return true;
  }

  state.clearSession(telegramId);
  const updated = await getClient(telegramId);
  await bot.sendMessage(chatId, t(lang, 'profile_saved'), { reply_markup: { remove_keyboard: true } });
  await showProfile(bot, chatId, updated);
  return true;
}

module.exports = {
  showProfile,
  showBalance,
  showEditProfile,
  startProfileField,
  handleProfileEditStep,
};
