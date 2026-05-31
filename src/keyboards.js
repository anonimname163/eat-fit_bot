// Сборка клавиатур (reply и inline) с учётом языка и роли.
const { t } = require('./i18n');

/** Reply-клавиатура главного меню с учётом роли. */
function mainMenuKeyboard(lang, role) {
  const rows = [
    [t(lang, 'btn_make_order')],
    [t(lang, 'btn_my_orders'), t(lang, 'btn_profile')],
    [t(lang, 'btn_balance')],
  ];
  if (role === 'cook') rows.push([t(lang, 'btn_cook_mode')]);
  if (role === 'courier') rows.push([t(lang, 'btn_courier_mode')]);
  if (role === 'admin') rows.push([t(lang, 'btn_admin_panel')]);

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

module.exports = {
  mainMenuKeyboard,
  languageKeyboard,
  shareContactKeyboard,
  dishCardKeyboard,
  addMoreKeyboard,
};
