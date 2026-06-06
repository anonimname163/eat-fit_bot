// Сборка клавиатур (reply и inline) с учётом языка и роли.
const { t } = require('./i18n');

/** Reply-клавиатура главного меню с учётом роли. */
function mainMenuKeyboard(lang, role, isAdmin) {
  const rows = [
    [t(lang, 'btn_make_order')],
    [t(lang, 'btn_my_orders'), t(lang, 'btn_profile')],
    [t(lang, 'btn_balance'), t(lang, 'btn_support')],
  ];
  // Кнопка открытия Mini App (если задан публичный URL приложения)
  if (process.env.WEB_APP_URL) {
    rows.push([{ text: t(lang, 'btn_webapp'), web_app: { url: process.env.WEB_APP_URL } }]);
  }
  if (role === 'cook') rows.push([t(lang, 'btn_cook_mode')]);
  if (role === 'courier') rows.push([t(lang, 'btn_courier_mode')]);
  // Кнопка админки — только реальным админам из ADMIN_TELEGRAM_IDS
  if (isAdmin) rows.push([t(lang, 'btn_admin_panel')]);

  return {
    reply_markup: {
      keyboard: rows,
      resize_keyboard: true,
    },
  };
}

/** Inline-клавиатура выбора языка. */
function languageKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [[
        { text: '🇷🇺 Русский', callback_data: 'lang:ru' },
        { text: "🇺🇿 O'zbek", callback_data: 'lang:uz' },
      ]],
    },
  };
}

/** Reply-клавиатура «Поделиться контактом». */
function shareContactKeyboard(lang) {
  return {
    reply_markup: {
      keyboard: [[{ text: t(lang, 'share_contact'), request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  };
}

/** Inline-кнопки добавления блюда из карточки. */
function dishCardKeyboard(lang, itemId) {
  return {
    reply_markup: {
      inline_keyboard: [[
        { text: t(lang, 'btn_add_to_cart'), callback_data: `cart:add:${itemId}` },
        { text: t(lang, 'btn_decline'), callback_data: 'cart:decline' },
      ]],
    },
  };
}

/** Inline-меню «добавить ещё / напитки / десерты / оформить». */
function addMoreKeyboard(lang) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: t(lang, 'btn_drinks'), callback_data: 'cart:cat:drink' },
          { text: t(lang, 'btn_desserts'), callback_data: 'cart:cat:dessert' },
        ],
        [{ text: t(lang, 'btn_checkout'), callback_data: 'cart:checkout' }],
      ],
    },
  };
}

/**
 * Ряд-степпер под блюдом: ➖ / количество / ➕.
 * Средняя кнопка — индикатор (ничего не делает).
 * @param {string} lang
 * @param {number} itemId
 * @param {number} qty текущее количество в корзине
 */
function stepperRow(lang, itemId, qty) {
  return [
    { text: '➖', callback_data: `qty:dec:${itemId}` },
    { text: `${qty} ${t(lang, 'pcs')}`, callback_data: 'qty:noop' },
    { text: '➕', callback_data: `qty:inc:${itemId}` },
  ];
}

module.exports = {
  mainMenuKeyboard,
  languageKeyboard,
  shareContactKeyboard,
  dishCardKeyboard,
  addMoreKeyboard,
  stepperRow,
};
