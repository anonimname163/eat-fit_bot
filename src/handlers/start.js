// /start, регистрация нового клиента, обработка deep link, главное меню.
const db = require('../db');
const { t } = require('../i18n');
const state = require('../state');
const kb = require('../keyboards');
const { getClient, isRegistered } = require('../middleware/registration');
const { effectiveRole, syncAdminRole, isEnvAdmin } = require('../middleware/auth');

/**
 * Показать главное меню зарегистрированному клиенту.
 */
async function showMainMenu(bot, chatId, client) {
  const lang = client.language || 'ru';
  const role = effectiveRole(client, client.telegram_id);
  const isAdmin = isEnvAdmin(client.telegram_id);
  await bot.sendMessage(chatId, t(lang, 'main_menu'), kb.mainMenuKeyboard(lang, role, isAdmin));
}

/**
 * Обработчик /start (и deep link).
 * @param {import('node-telegram-bot-api')} bot
 * @param {object} msg
 * @param {object} order модуль handlers/order (для открытия карточки блюда)
 */
async function handleStart(bot, msg, order) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  // Разбор deep link: /start item_<id>
  let deepItemId = null;
  const parts = (msg.text || '').split(' ');
  if (parts.length > 1) {
    const payload = parts[1].trim();
    const m = payload.match(/^item_(\d+)$/);
    if (m) deepItemId = Number(m[1]);
  }

  let client = await getClient(telegramId);

  // Новый пользователь — создаём заготовку и спрашиваем язык
  if (!client) {
    await db.query(
      `INSERT INTO clients (telegram_id, first_name, username, role)
       VALUES ($1, $2, $3, 'client')
       ON CONFLICT (telegram_id) DO NOTHING`,
      [telegramId, msg.from.first_name || null, msg.from.username || null]
    );
    client = await getClient(telegramId);
  }

  await syncAdminRole(telegramId);
  client = await getClient(telegramId);

  // Держим @username актуальным (для поиска в админке)
  const uname = msg.from.username || null;
  if (client && client.username !== uname) {
    await db.query('UPDATE clients SET username = $1 WHERE telegram_id = $2', [uname, telegramId]);
    client.username = uname;
  }

  // Если регистрация не завершена — запускаем диалог регистрации
  if (!isRegistered(client)) {
    // Сохраним отложенное блюдо, чтобы открыть его после регистрации
    state.setSession(telegramId, 'register', 'language', { deepItemId });
    await bot.sendMessage(chatId, t(client.language || 'ru', 'choose_language'), kb.languageKeyboard());
    return;
  }

  // Зарегистрирован: если был deep link — открыть меню с выбранным блюдом (1 шт)
  if (deepItemId && order) {
    await showMainMenu(bot, chatId, client);
    await order.openDishFromDeepLink(bot, chatId, client, deepItemId);
    return;
  }

  await showMainMenu(bot, chatId, client);
}

/**
 * Шаги диалога регистрации (вызывается из общего текстового роутера).
 * Возвращает true, если сообщение обработано как часть регистрации.
 */
async function handleRegistrationStep(bot, msg, order) {
  const telegramId = msg.from.id;
  const chatId = msg.chat.id;
  const session = state.getSession(telegramId);
  if (!session || session.flow !== 'register') return false;

  const client = await getClient(telegramId);
  const lang = (client && client.language) || 'ru';

  switch (session.step) {
    case 'language':
      // Ждём нажатия inline-кнопки языка; текст игнорируем
      await bot.sendMessage(chatId, t(lang, 'choose_language'), kb.languageKeyboard());
      return true;

    case 'full_name': {
      // Имя и фамилия одной строкой: первое слово — имя, остальное — фамилия
      const fullName = (msg.text || '').trim().replace(/\s+/g, ' ');
      if (!fullName) return true;
      const [firstName, ...rest] = fullName.split(' ');
      const lastName = rest.join(' ') || null;
      await db.query(
        'UPDATE clients SET first_name = $1, last_name = $2 WHERE telegram_id = $3',
        [firstName, lastName, telegramId]
      );
      state.updateSession(telegramId, { step: 'phone' });
      await bot.sendMessage(chatId, t(lang, 'ask_phone'), kb.shareContactKeyboard(lang));
      return true;
    }

    case 'phone': {
      // Телефон может прийти как контакт или текстом
      let phone = null;
      if (msg.contact && msg.contact.phone_number) {
        phone = msg.contact.phone_number;
      } else if (msg.text) {
        const cleaned = msg.text.replace(/[^\d+]/g, '');
        if (cleaned.replace(/\D/g, '').length >= 7) phone = cleaned;
      }
      if (!phone) {
        await bot.sendMessage(chatId, t(lang, 'invalid_phone'), kb.shareContactKeyboard(lang));
        return true;
      }
      await db.query('UPDATE clients SET phone = $1 WHERE telegram_id = $2', [phone, telegramId]);
      state.updateSession(telegramId, { step: 'address' });
      await bot.sendMessage(chatId, t(lang, 'ask_address'), { reply_markup: { remove_keyboard: true } });
      return true;
    }

    case 'address': {
      const address = (msg.text || '').trim();
      if (!address) return true;
      await db.query('UPDATE clients SET address = $1 WHERE telegram_id = $2', [address, telegramId]);

      const deepItemId = session.data && session.data.deepItemId;
      state.clearSession(telegramId);

      const updated = await getClient(telegramId);
      await bot.sendMessage(chatId, t(lang, 'registration_done'));
      await showMainMenu(bot, chatId, updated);

      if (deepItemId && order) {
        await order.openDishFromDeepLink(bot, chatId, updated, deepItemId);
      }
      return true;
    }

    default:
      return false;
  }
}

/**
 * Обработка выбора языка (callback lang:ru / lang:uz).
 */
async function handleLanguageChoice(bot, query) {
  const telegramId = query.from.id;
  const chatId = query.message.chat.id;
  const lang = query.data.split(':')[1] === 'uz' ? 'uz' : 'ru';

  await db.query('UPDATE clients SET language = $1 WHERE telegram_id = $2', [lang, telegramId]);

  const session = state.getSession(telegramId);
  if (session && session.flow === 'register' && session.step === 'language') {
    state.updateSession(telegramId, { step: 'full_name' });
    await bot.sendMessage(chatId, t(lang, 'language_set'));
    await bot.sendMessage(chatId, t(lang, 'ask_full_name'));
  } else {
    // Смена языка вне регистрации
    const client = await getClient(telegramId);
    await bot.sendMessage(chatId, t(lang, 'language_set'));
    if (client) await showMainMenu(bot, chatId, client);
  }
}

module.exports = {
  handleStart,
  handleRegistrationStep,
  handleLanguageChoice,
  showMainMenu,
};
