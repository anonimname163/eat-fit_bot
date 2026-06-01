// Панель администратора: меню, пользователи, депозиты, заказы, генерация постов.
const db = require('../db');
const { t, dishName, formatMoney, categoryName, esc } = require('../i18n');
const state = require('../state');
const settings = require('../settings');
const notify = require('../utils/notify');
const { getClient } = require('../middleware/registration');
const { buildChannelPost, dishDeepLink } = require('../utils/deeplink');

const ROLES = ['client', 'cook', 'courier', 'admin'];

/**
 * Извлечь file_id фото из сообщения любого типа:
 * - сжатое фото (msg.photo) любого формата
 * - изображение, отправленное как файл/документ (png, jpg, jpeg, webp, gif, heic…)
 * - прямая ссылка-URL текстом
 * Возвращает строку (file_id или URL) либо null.
 */
function extractPhoto(msg) {
  if (msg.photo && msg.photo.length) {
    return msg.photo[msg.photo.length - 1].file_id; // лучшее качество
  }
  if (msg.document) {
    const mime = msg.document.mime_type || '';
    const fname = (msg.document.file_name || '').toLowerCase();
    const isImage =
      mime.startsWith('image/') ||
      /\.(png|jpe?g|webp|gif|bmp|tiff?|heic|heif)$/i.test(fname);
    if (isImage) return msg.document.file_id;
  }
  if (msg.text && msg.text.trim() && msg.text.trim() !== '-') {
    return msg.text.trim();
  }
  return null;
}

/** Открыть главную панель администратора. */
async function showAdminPanel(bot, chatId, client) {
  const lang = client.language || 'ru';
  await bot.sendMessage(chatId, `<b>${esc(t(lang, 'admin_panel_title'))}</b>`, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: t(lang, 'admin_menu_mgmt'), callback_data: 'admin:menu' }],
        [{ text: t(lang, 'admin_users'), callback_data: 'admin:users' }],
        [{ text: t(lang, 'admin_deposits'), callback_data: 'admin:deposits' }],
        [{ text: t(lang, 'admin_orders'), callback_data: 'admin:orders' }],
        [{ text: t(lang, 'admin_gen_post'), callback_data: 'admin:genpost' }],
        [{ text: t(lang, 'admin_report'), callback_data: 'admin:report' }],
        [{ text: t(lang, 'admin_contacts'), callback_data: 'admin:contacts' }],
        [{ text: t(lang, 'admin_support'), callback_data: 'admin:support' }],
      ],
    },
  });
}

/** Показать текущие контакты пополнения + кнопки редактирования. */
async function showContacts(bot, chatId, lang) {
  const tg = await settings.getSetting(settings.KEYS.TOPUP_TELEGRAM);
  const phone = await settings.getSetting(settings.KEYS.TOPUP_PHONE);
  const lines = [
    `<b>${esc(t(lang, 'contacts_title'))}</b>`,
    '',
    `📱 ${esc(t(lang, 'topup_tg'))}: ${esc(tg || t(lang, 'not_set_dash'))}`,
    `📞 ${esc(t(lang, 'topup_phone'))}: ${esc(phone || t(lang, 'not_set_dash'))}`,
  ];
  await bot.sendMessage(chatId, lines.join('\n'), {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[
        { text: t(lang, 'contact_edit_tg'), callback_data: 'admin:contact:tg' },
        { text: t(lang, 'contact_edit_phone'), callback_data: 'admin:contact:phone' },
      ]],
    },
  });
}

// Поля редактируемых контактов: какой текст спросить и в какой ключ настроек сохранить.
const CONTACT_FIELDS = {
  tg: { ask: 'contact_ask_tg', key: settings.KEYS.TOPUP_TELEGRAM },
  phone: { ask: 'contact_ask_phone', key: settings.KEYS.TOPUP_PHONE },
  support: { ask: 'support_ask', key: settings.KEYS.SUPPORT_CONTACT },
};

/** Показать текущее назначение кнопки «Поддержка» + кнопку редактирования. */
async function showSupportSetting(bot, chatId, lang) {
  const value = await settings.getSetting(settings.KEYS.SUPPORT_CONTACT);
  const lines = [
    `<b>${esc(t(lang, 'support_settings_title'))}</b>`,
    '',
    `🆘 ${esc(t(lang, 'support_current'))}: ${esc(value || t(lang, 'not_set_dash'))}`,
  ];
  await bot.sendMessage(chatId, lines.join('\n'), {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[{ text: t(lang, 'support_edit_btn'), callback_data: 'admin:contact:support' }]],
    },
  });
}

/** Начать редактирование контакта (callback admin:contact:tg|phone|support). */
async function startEditContact(bot, query, lang) {
  const field = query.data.split(':')[2]; // tg | phone | support
  const def = CONTACT_FIELDS[field];
  await bot.answerCallbackQuery(query.id);
  if (!def) return;
  state.setSession(query.from.id, 'edit_contact', field, {});
  await bot.sendMessage(query.message.chat.id, t(lang, def.ask));
}

/** Шаг ввода значения контакта. Возвращает true если обработано. */
async function handleContactStep(bot, msg) {
  const telegramId = msg.from.id;
  const chatId = msg.chat.id;
  const session = state.getSession(telegramId);
  if (!session || session.flow !== 'edit_contact') return false;

  const client = await getClient(telegramId);
  const lang = (client && client.language) || 'ru';
  const value = (msg.text || '').trim();
  if (!value) return true;

  const def = CONTACT_FIELDS[session.step] || CONTACT_FIELDS.tg;
  await settings.setSetting(def.key, value);
  state.clearSession(telegramId);
  console.log(`[INFO] Контакт (${session.step}) обновлён админом ${telegramId}`);

  if (session.step === 'support') {
    await bot.sendMessage(chatId, t(lang, 'support_saved'));
    await showSupportSetting(bot, chatId, lang);
  } else {
    await bot.sendMessage(chatId, t(lang, 'contact_saved'));
    await showContacts(bot, chatId, lang);
  }
  return true;
}

// ==================== Управление меню ====================

async function showMenuManagement(bot, chatId, lang) {
  const { rows } = await db.query('SELECT * FROM menu_items ORDER BY id');
  await bot.sendMessage(chatId, `<b>${esc(t(lang, 'admin_menu_mgmt'))}</b>`, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[{ text: t(lang, 'btn_add_dish'), callback_data: 'admin:dish:add' }]],
    },
  });

  for (const item of rows) {
    const card = dishMgmtCard(lang, item);
    await bot.sendMessage(chatId, card.text, card.opts);
  }
}

/** Сборка карточки блюда в управлении меню (текст + кнопки). */
function dishMgmtCard(lang, item) {
  const status = item.is_active ? '🟢' : '🔴';
  const text =
    `${status} <b>${esc(dishName(lang, item))}</b> — ${esc(formatMoney(item.price))} ${esc(t(lang, 'currency'))}\n` +
    `<i>${esc(categoryName(lang, item.category))}</i>`;
  const toggleBtn = item.is_active
    ? { text: t(lang, 'btn_hide'), callback_data: `admin:dish:hide:${item.id}` }
    : { text: t(lang, 'btn_show'), callback_data: `admin:dish:show:${item.id}` };
  return {
    text,
    opts: {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: t(lang, 'btn_edit'), callback_data: `admin:dish:edit:${item.id}` },
            toggleBtn,
          ],
          [{ text: t(lang, 'btn_delete'), callback_data: `admin:dish:del:${item.id}` }],
        ],
      },
    },
  };
}

/** Начать диалог добавления блюда. */
async function startAddDish(bot, chatId, telegramId, lang) {
  state.setSession(telegramId, 'add_dish', 'name_ru', {});
  await bot.sendMessage(chatId, t(lang, 'dish_ask_name_ru'));
}

/** Шаги добавления блюда (текст/фото). Возвращает true если обработано. */
async function handleAddDishStep(bot, msg) {
  const telegramId = msg.from.id;
  const chatId = msg.chat.id;
  const session = state.getSession(telegramId);
  if (!session || session.flow !== 'add_dish') return false;

  const client = await getClient(telegramId);
  const lang = (client && client.language) || 'ru';
  const data = session.data;

  switch (session.step) {
    case 'name_ru':
      data.name_ru = (msg.text || '').trim();
      state.updateSession(telegramId, { step: 'name_uz', data });
      await bot.sendMessage(chatId, t(lang, 'dish_ask_name_uz'));
      return true;

    case 'name_uz':
      data.name_uz = (msg.text || '').trim();
      state.updateSession(telegramId, { step: 'desc_ru', data });
      await bot.sendMessage(chatId, t(lang, 'dish_ask_desc_ru'));
      return true;

    case 'desc_ru':
      data.description_ru = (msg.text || '').trim();
      state.updateSession(telegramId, { step: 'desc_uz', data });
      await bot.sendMessage(chatId, t(lang, 'dish_ask_desc_uz'));
      return true;

    case 'desc_uz':
      data.description_uz = (msg.text || '').trim();
      state.updateSession(telegramId, { step: 'category', data });
      await bot.sendMessage(chatId, t(lang, 'dish_ask_category'), {
        reply_markup: {
          inline_keyboard: [[
            { text: t(lang, 'cat_main'), callback_data: 'admin:dishcat:main' },
            { text: t(lang, 'cat_drink'), callback_data: 'admin:dishcat:drink' },
            { text: t(lang, 'cat_dessert'), callback_data: 'admin:dishcat:dessert' },
          ]],
        },
      });
      return true;

    case 'price': {
      const price = Number((msg.text || '').replace(/\s/g, '').replace(',', '.'));
      if (!price || price <= 0) {
        await bot.sendMessage(chatId, t(lang, 'invalid_price'));
        return true;
      }
      data.price = price;
      state.updateSession(telegramId, { step: 'photo', data });
      await bot.sendMessage(chatId, t(lang, 'dish_ask_photo'));
      return true;
    }

    case 'photo': {
      const photoUrl = extractPhoto(msg);
      data.photo_url = photoUrl;
      console.log(`[INFO] Фото блюда: ${photoUrl ? 'сохранён (' + photoUrl.slice(0, 12) + '…)' : 'без фото'}`);

      const { rows } = await db.query(
        `INSERT INTO menu_items (name_ru, name_uz, description_ru, description_uz, category, price, photo_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [data.name_ru, data.name_uz, data.description_ru, data.description_uz, data.category, data.price, data.photo_url]
      );
      const item = rows[0];
      state.clearSession(telegramId);
      console.log(`[INFO] Создано блюдо #${item.id} (${item.name_ru})`);

      await bot.sendMessage(chatId, t(lang, 'dish_created'));
      // Показать фото-превью (подтверждение, что file_id валиден)
      if (item.photo_url) {
        try {
          await bot.sendPhoto(chatId, item.photo_url, { caption: `🍽 ${item.name_ru}` });
        } catch (err) {
          const body = err.response && err.response.body ? JSON.stringify(err.response.body) : err.message;
          console.error('[ERROR] sendPhoto превью (item', item.id, '):', body);
          // Фото битое — обнуляем и предупреждаем админа
          await db.query('UPDATE menu_items SET photo_url = NULL WHERE id = $1', [item.id]);
          item.photo_url = null;
          await bot.sendMessage(chatId, t(lang, 'photo_save_failed'));
        }
      }
      // Сразу выдать готовый пост для канала (фото + текст + кнопка)
      await bot.sendMessage(chatId, t(lang, 'post_for_channel'));
      await sendChannelPost(bot, chatId, item, lang);
      return true;
    }

    default:
      return false;
  }
}

/** Выбор категории при добавлении блюда (callback admin:dishcat:<cat>). */
async function handleDishCategory(bot, query) {
  const telegramId = query.from.id;
  const chatId = query.message.chat.id;
  const session = state.getSession(telegramId);
  const client = await getClient(telegramId);
  const lang = (client && client.language) || 'ru';
  await bot.answerCallbackQuery(query.id);

  if (!session || session.flow !== 'add_dish' || session.step !== 'category') return;
  const category = query.data.split(':')[2];
  session.data.category = category;
  state.updateSession(telegramId, { step: 'price', data: session.data });
  await bot.sendMessage(chatId, t(lang, 'dish_ask_price'));
}

/** Скрыть/показать/удалить блюдо. */
async function dishToggle(bot, query, lang) {
  const parts = query.data.split(':'); // admin:dish:hide|show|del:<id>
  const action = parts[2];
  const id = Number(parts[3]);

  if (action === 'hide') {
    await db.query('UPDATE menu_items SET is_active = FALSE WHERE id = $1', [id]);
    await bot.answerCallbackQuery(query.id, { text: t(lang, 'dish_hidden') });
  } else if (action === 'show') {
    await db.query('UPDATE menu_items SET is_active = TRUE WHERE id = $1', [id]);
    await bot.answerCallbackQuery(query.id, { text: t(lang, 'dish_shown') });
  } else if (action === 'del') {
    await db.query('DELETE FROM menu_items WHERE id = $1', [id]);
    await bot.answerCallbackQuery(query.id, { text: t(lang, 'dish_deleted') });
    try {
      await bot.deleteMessage(query.message.chat.id, query.message.message_id);
    } catch (_) { /* игнор */ }
    return;
  }
  // Обновить статусную плашку
  try {
    const { rows } = await db.query('SELECT * FROM menu_items WHERE id = $1', [id]);
    if (rows.length) {
      const card = dishMgmtCard(lang, rows[0]);
      await bot.editMessageText(card.text, {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        parse_mode: 'HTML',
        reply_markup: card.opts.reply_markup,
      });
    }
  } catch (_) { /* игнор */ }
}

// ==================== Редактирование блюда ====================

// Поля для редактирования: ключ → { column, prompt(label key), type }
const EDIT_FIELDS = {
  name_ru: { column: 'name_ru', prompt: 'dish_ask_name_ru', label: 'field_name_ru', type: 'text' },
  name_uz: { column: 'name_uz', prompt: 'dish_ask_name_uz', label: 'field_name_uz', type: 'text' },
  desc_ru: { column: 'description_ru', prompt: 'dish_ask_desc_ru', label: 'field_desc_ru', type: 'text' },
  desc_uz: { column: 'description_uz', prompt: 'dish_ask_desc_uz', label: 'field_desc_uz', type: 'text' },
  price: { column: 'price', prompt: 'dish_ask_price', label: 'field_price', type: 'price' },
  photo: { column: 'photo_url', prompt: 'dish_ask_photo', label: 'field_photo', type: 'photo' },
  category: { column: 'category', prompt: 'dish_ask_category', label: 'field_category', type: 'category' },
};

/** Показать меню выбора поля для редактирования (callback admin:dish:edit:<id>). */
async function showEditFields(bot, query, lang) {
  const id = Number(query.data.split(':')[3]);
  await bot.answerCallbackQuery(query.id);
  const { rows } = await db.query('SELECT * FROM menu_items WHERE id = $1', [id]);
  if (!rows.length) {
    await bot.sendMessage(query.message.chat.id, t(lang, 'dish_not_found'));
    return;
  }
  const item = rows[0];
  const keys = ['name_ru', 'name_uz', 'desc_ru', 'desc_uz', 'category', 'price', 'photo'];
  const buttons = keys.map((k) => [{ text: t(lang, EDIT_FIELDS[k].label), callback_data: `admin:editf:${id}:${k}` }]);
  await bot.sendMessage(
    query.message.chat.id,
    `${esc(t(lang, 'edit_choose_field'))}\n🍽 <b>${esc(dishName(lang, item))}</b>`,
    { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons } }
  );
}

/** Начать редактирование конкретного поля (callback admin:editf:<id>:<field>). */
async function startEditField(bot, query, lang) {
  const parts = query.data.split(':'); // admin:editf:<id>:<field>
  const id = Number(parts[2]);
  const field = parts[3];
  const def = EDIT_FIELDS[field];
  if (!def) {
    await bot.answerCallbackQuery(query.id);
    return;
  }
  await bot.answerCallbackQuery(query.id);
  const chatId = query.message.chat.id;
  const telegramId = query.from.id;

  if (def.type === 'category') {
    // Выбор категории кнопками
    await bot.sendMessage(chatId, t(lang, 'dish_ask_category'), {
      reply_markup: {
        inline_keyboard: [[
          { text: t(lang, 'cat_main'), callback_data: `admin:editcat:${id}:main` },
          { text: t(lang, 'cat_drink'), callback_data: `admin:editcat:${id}:drink` },
          { text: t(lang, 'cat_dessert'), callback_data: `admin:editcat:${id}:dessert` },
        ]],
      },
    });
    return;
  }

  state.setSession(telegramId, 'edit_dish', field, { id });
  await bot.sendMessage(chatId, t(lang, def.prompt));
}

/** Установить категорию при редактировании (callback admin:editcat:<id>:<cat>). */
async function handleEditCategory(bot, query, lang) {
  const parts = query.data.split(':'); // admin:editcat:<id>:<cat>
  const id = Number(parts[2]);
  const category = parts[3];
  await bot.answerCallbackQuery(query.id, { text: t(lang, 'edit_saved') });
  await db.query('UPDATE menu_items SET category = $1 WHERE id = $2', [category, id]);
  console.log(`[INFO] Блюдо #${id}: категория → ${category}`);
}

/** Шаг ввода нового значения поля (текст/фото). Возвращает true если обработано. */
async function handleEditDishStep(bot, msg) {
  const telegramId = msg.from.id;
  const chatId = msg.chat.id;
  const session = state.getSession(telegramId);
  if (!session || session.flow !== 'edit_dish') return false;

  const client = await getClient(telegramId);
  const lang = (client && client.language) || 'ru';
  const field = session.step;
  const def = EDIT_FIELDS[field];
  const id = session.data.id;
  if (!def) {
    state.clearSession(telegramId);
    return true;
  }

  let value;
  if (def.type === 'price') {
    value = Number((msg.text || '').replace(/\s/g, '').replace(',', '.'));
    if (!value || value <= 0) {
      await bot.sendMessage(chatId, t(lang, 'invalid_price'));
      return true;
    }
  } else if (def.type === 'photo') {
    value = extractPhoto(msg);
    if (!value) {
      await bot.sendMessage(chatId, t(lang, 'dish_ask_photo'));
      return true;
    }
  } else {
    value = (msg.text || '').trim();
    if (!value) return true;
  }

  await db.query(`UPDATE menu_items SET ${def.column} = $1 WHERE id = $2`, [value, id]);
  state.clearSession(telegramId);
  console.log(`[INFO] Блюдо #${id}: поле ${def.column} обновлено`);

  // Для фото — сразу проверим валидность превью
  if (def.type === 'photo') {
    try {
      await bot.sendPhoto(chatId, value, { caption: t(lang, 'edit_saved') });
    } catch (err) {
      const body = err.response && err.response.body ? JSON.stringify(err.response.body) : err.message;
      console.error('[ERROR] sendPhoto превью при редактировании (item', id, '):', body);
      await db.query('UPDATE menu_items SET photo_url = NULL WHERE id = $1', [id]);
      await bot.sendMessage(chatId, t(lang, 'photo_save_failed'));
    }
    return true;
  }

  await bot.sendMessage(chatId, t(lang, 'edit_saved'));
  // Показать обновлённую карточку
  const { rows } = await db.query('SELECT * FROM menu_items WHERE id = $1', [id]);
  if (rows.length) {
    const card = dishMgmtCard(lang, rows[0]);
    await bot.sendMessage(chatId, card.text, card.opts);
  }
  return true;
}

// ==================== Пользователи ====================

async function startUserSearch(bot, chatId, telegramId, lang) {
  state.setSession(telegramId, 'user_search', 'query', {});
  await bot.sendMessage(chatId, t(lang, 'users_ask_query'));
}

/** Шаг поиска пользователя (текст). */
async function handleUserSearchStep(bot, msg) {
  const telegramId = msg.from.id;
  const chatId = msg.chat.id;
  const session = state.getSession(telegramId);
  if (!session || session.flow !== 'user_search') return false;

  const client = await getClient(telegramId);
  const lang = (client && client.language) || 'ru';
  const q = (msg.text || '').trim().replace(/^@/, '');
  state.clearSession(telegramId);

  const { rows } = await db.query(
    `SELECT * FROM clients
      WHERE phone ILIKE $1 OR CAST(telegram_id AS TEXT) = $2
      ORDER BY id LIMIT 5`,
    [`%${q}%`, q]
  );

  if (!rows.length) {
    await bot.sendMessage(chatId, t(lang, 'user_not_found'));
    return true;
  }

  for (const u of rows) {
    const { rows: orderCount } = await db.query(
      'SELECT COUNT(*)::int AS c FROM orders WHERE client_id = $1',
      [u.id]
    );
    const lines = [
      `👤 <b>${esc(`${u.first_name || ''} ${u.last_name || ''}`.trim())}</b>`,
      `ID: <code>${esc(u.telegram_id)}</code>`,
      `${esc(t(lang, 'profile_phone'))}: ${esc(u.phone || '-')}`,
      `${esc(t(lang, 'profile_balance'))}: ${esc(formatMoney(u.balance))} ${esc(t(lang, 'currency'))}`,
      `Role: ${esc(u.role)}`,
      `${esc(t(lang, 'btn_my_orders'))}: ${orderCount[0].c}`,
    ];
    await bot.sendMessage(chatId, lines.join('\n'), {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: t(lang, 'btn_change_role'), callback_data: `admin:role:${u.telegram_id}` }]],
      },
    });
  }
  return true;
}

/** Показать кнопки выбора роли. */
async function showRolePicker(bot, query, lang) {
  const targetId = query.data.split(':')[2];
  await bot.answerCallbackQuery(query.id);
  const buttons = ROLES.map((r) => ({ text: r, callback_data: `admin:setrole:${targetId}:${r}` }));
  await bot.sendMessage(query.message.chat.id, t(lang, 'btn_change_role'), {
    reply_markup: { inline_keyboard: [buttons] },
  });
}

/** Установить роль пользователю. */
async function setUserRole(bot, query, lang) {
  const parts = query.data.split(':'); // admin:setrole:<tgid>:<role>
  const targetId = parts[2];
  const role = parts[3];
  if (!ROLES.includes(role)) {
    await bot.answerCallbackQuery(query.id);
    return;
  }
  await db.query('UPDATE clients SET role = $1 WHERE telegram_id = $2', [role, targetId]);
  await bot.answerCallbackQuery(query.id, { text: `${t(lang, 'role_changed')} ${role}` });
  console.log(`[INFO] Роль пользователя ${targetId} изменена на ${role}`);
}

// ==================== Депозиты ====================

async function startDeposit(bot, chatId, telegramId, lang) {
  state.setSession(telegramId, 'deposit', 'client', {});
  await bot.sendMessage(chatId, t(lang, 'deposit_ask_client'));
}

/** Шаги пополнения баланса. */
async function handleDepositStep(bot, msg) {
  const telegramId = msg.from.id;
  const chatId = msg.chat.id;
  const session = state.getSession(telegramId);
  if (!session || session.flow !== 'deposit') return false;

  const admin = await getClient(telegramId);
  const lang = (admin && admin.language) || 'ru';

  if (session.step === 'client') {
    const q = (msg.text || '').trim().replace(/^@/, '');
    const { rows } = await db.query(
      `SELECT * FROM clients WHERE CAST(telegram_id AS TEXT) = $1 OR phone ILIKE $2 ORDER BY id LIMIT 1`,
      [q, `%${q}%`]
    );
    if (!rows.length) {
      state.clearSession(telegramId);
      await bot.sendMessage(chatId, t(lang, 'user_not_found'));
      return true;
    }
    session.data.clientId = rows[0].id;
    session.data.clientTgId = rows[0].telegram_id;
    state.updateSession(telegramId, { step: 'amount', data: session.data });
    await bot.sendMessage(chatId, t(lang, 'deposit_ask_amount'));
    return true;
  }

  if (session.step === 'amount') {
    const amount = Number((msg.text || '').replace(/\s/g, '').replace(',', '.'));
    if (!amount || amount <= 0) {
      await bot.sendMessage(chatId, t(lang, 'invalid_price'));
      return true;
    }
    const { clientId } = session.data;
    state.clearSession(telegramId);

    try {
      await db.withTransaction(async (tx) => {
        await tx.query('UPDATE clients SET balance = balance + $1 WHERE id = $2', [amount, clientId]);
        await tx.query(
          `INSERT INTO deposits (client_id, amount, note, created_by) VALUES ($1, $2, $3, $4)`,
          [clientId, amount, 'admin top-up', telegramId]
        );
      });
      console.log(`[INFO] Пополнение баланса клиента #${clientId} на ${amount} админом ${telegramId}`);
      await bot.sendMessage(chatId, `${t(lang, 'deposit_done')} (+${formatMoney(amount)} ${t(lang, 'currency')})`);

      // Уведомить клиента и админ-группу
      try {
        const { rows } = await db.query('SELECT telegram_id, language, first_name, last_name FROM clients WHERE id = $1', [clientId]);
        if (rows.length) {
          const c = rows[0];
          await bot.sendMessage(c.telegram_id, `💰 +${formatMoney(amount)} ${t(c.language, 'currency')}`);
          await notify.notifyAdminEvent(
            bot,
            `💵 <b>Пополнение баланса</b>\n👤 ${esc(`${c.first_name || ''} ${c.last_name || ''}`.trim())} (#${clientId})\n➕ ${esc(formatMoney(amount))} ${esc(t('ru', 'currency'))}\n🔑 админ: <code>${esc(telegramId)}</code>`
          );
        }
      } catch (_) { /* игнор */ }
    } catch (err) {
      console.error('[ERROR] deposit:', err);
      await bot.sendMessage(chatId, t(lang, 'error_generic'));
    }
    return true;
  }
  return false;
}

/** История пополнений (последние 15). */
async function showDepositHistory(bot, chatId, lang) {
  const { rows } = await db.query(
    `SELECT d.amount, d.created_at, c.first_name, c.phone
       FROM deposits d JOIN clients c ON c.id = d.client_id
      ORDER BY d.id DESC LIMIT 15`
  );
  if (!rows.length) {
    await bot.sendMessage(chatId, t(lang, 'deposit_history') + '\n—');
    return;
  }
  const lines = [`<b>${esc(t(lang, 'deposit_history'))}</b>`];
  for (const d of rows) {
    lines.push(`• ${esc(d.first_name || '')} (${esc(d.phone || '-')}): +${esc(formatMoney(d.amount))} ${esc(t(lang, 'currency'))}`);
  }
  await bot.sendMessage(chatId, lines.join('\n'), { parse_mode: 'HTML' });
}

// ==================== Заказы (обзор) ====================

async function showOrdersOverview(bot, chatId, lang) {
  const { rows } = await db.query(
    `SELECT status, COUNT(*)::int AS c, COALESCE(SUM(total_amount),0) AS sum
       FROM orders GROUP BY status ORDER BY status`
  );
  const { rows: recent } = await db.query(
    `SELECT o.id, o.status, o.total_amount, c.first_name
       FROM orders o JOIN clients c ON c.id = o.client_id
      ORDER BY o.id DESC LIMIT 10`
  );

  const lines = [`<b>${esc(t(lang, 'admin_orders'))}</b>`, ''];
  for (const r of rows) {
    lines.push(`${esc(t(lang, `status_${r.status}`))}: ${r.c} (${esc(formatMoney(r.sum))} ${esc(t(lang, 'currency'))})`);
  }
  lines.push('');
  lines.push('—'.repeat(10));
  const cancelButtons = [];
  for (const o of recent) {
    lines.push(`#${o.id} ${esc(o.first_name || '')} — ${esc(formatMoney(o.total_amount))} ${esc(t(lang, 'currency'))} [${esc(t(lang, `status_${o.status}`))}]`);
    if (o.status !== 'done' && o.status !== 'cancelled') {
      cancelButtons.push({ text: `🚫 #${o.id}`, callback_data: `admin:cancelorder:${o.id}` });
    }
  }

  // Кнопки отмены/возврата активных заказов (по 3 в ряд)
  const keyboard = [];
  for (let i = 0; i < cancelButtons.length; i += 3) {
    keyboard.push(cancelButtons.slice(i, i + 3));
  }

  await bot.sendMessage(chatId, lines.join('\n'), {
    parse_mode: 'HTML',
    reply_markup: keyboard.length ? { inline_keyboard: keyboard } : undefined,
  });
}

/**
 * Отмена / возврат заказа админом: статус → cancelled, возврат оплаченного
 * с баланса обратно клиенту, уведомления клиенту и в админ-группу.
 */
async function cancelOrderByAdmin(bot, query, lang) {
  const orderId = Number(query.data.split(':')[2]);
  const { rows } = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (!rows.length) {
    await bot.answerCallbackQuery(query.id, { text: t(lang, 'error_generic') });
    return;
  }
  const order = rows[0];
  if (order.status === 'cancelled' || order.status === 'done') {
    await bot.answerCallbackQuery(query.id, { text: t(lang, 'order_already_closed') });
    return;
  }

  const refund = Number(order.paid_from_balance) || 0;
  const updated = await db.withTransaction(async (tx) => {
    if (refund > 0) {
      await tx.query('UPDATE clients SET balance = balance + $1 WHERE id = $2', [refund, order.client_id]);
    }
    const { rows: u } = await tx.query(
      `UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [orderId]
    );
    return u[0];
  });

  await bot.answerCallbackQuery(query.id, { text: t(lang, 'order_cancelled_admin') });
  console.log(`[ORDER] Заказ #${orderId} отменён админом ${query.from.id}, возврат ${refund}`);

  await notify.notifyClientStatus(bot, updated, 'cancelled');
  await notify.updateAdminGroup(bot, updated);
  const refundText = refund > 0 ? `\n💸 Возврат на баланс: ${esc(formatMoney(refund))} ${esc(t('ru', 'currency'))}` : '';
  await notify.notifyAdminEvent(bot, `❌ <b>Заказ #${orderId} отменён</b> админом <code>${esc(query.from.id)}</code>${refundText}`);
}

// ==================== Генерация постов ====================

async function showGenPostMenu(bot, chatId, lang) {
  const { rows } = await db.query('SELECT * FROM menu_items WHERE is_active = TRUE ORDER BY id');
  if (!rows.length) {
    await bot.sendMessage(chatId, t(lang, 'menu_empty'));
    return;
  }
  const buttons = rows.map((i) => [{ text: dishName(lang, i), callback_data: `admin:post:${i.id}` }]);
  buttons.push([{ text: t(lang, 'gen_post_all'), callback_data: 'admin:post:all' }]);
  await bot.sendMessage(chatId, t(lang, 'gen_post_choose'), {
    reply_markup: { inline_keyboard: buttons },
  });
}

/**
 * Показать админу превью поста: фото + текст + кнопка «Заказать» (url) и
 * кнопка «Опубликовать в канал» (бот сам отправит пост — без отметки отправителя).
 */
async function sendChannelPost(bot, chatId, item, lang) {
  const text = buildChannelPost(item, lang);
  const keyboard = {
    inline_keyboard: [
      [{ text: t(lang, 'post_order_btn'), url: dishDeepLink(item.id) }],
      [{ text: t(lang, 'btn_publish_channel'), callback_data: `admin:publish:${item.id}` }],
    ],
  };
  if (item.photo_url) {
    try {
      await bot.sendPhoto(chatId, item.photo_url, { caption: text, reply_markup: keyboard });
      return;
    } catch (err) {
      const body = err.response && err.response.body ? JSON.stringify(err.response.body) : err.message;
      console.error('[ERROR] sendChannelPost photo (item', item.id, '):', body);
      // битое фото — обнулим, чтобы не мешало дальше
      await db.query('UPDATE menu_items SET photo_url = NULL WHERE id = $1', [item.id]);
    }
  }
  await bot.sendMessage(chatId, text, { reply_markup: keyboard });
}

/**
 * Опубликовать пост напрямую в канал (CHANNEL_ID) — это обычный пост канала,
 * без «Переслано от …». Бот должен быть админом канала.
 * @returns {Promise<{ok:boolean, reason?:string}>}
 */
async function publishDishToChannel(bot, item, lang) {
  const channelId = process.env.CHANNEL_ID;
  if (!channelId) return { ok: false, reason: 'no_channel' };

  const text = buildChannelPost(item, lang);
  const keyboard = {
    inline_keyboard: [[{ text: t(lang, 'post_order_btn'), url: dishDeepLink(item.id) }]],
  };
  try {
    if (item.photo_url) {
      try {
        await bot.sendPhoto(channelId, item.photo_url, { caption: text, reply_markup: keyboard });
        return { ok: true };
      } catch (err) {
        const body = err.response && err.response.body ? JSON.stringify(err.response.body) : err.message;
        console.error('[ERROR] publish photo (item', item.id, '):', body);
        await db.query('UPDATE menu_items SET photo_url = NULL WHERE id = $1', [item.id]);
      }
    }
    await bot.sendMessage(channelId, text, { reply_markup: keyboard });
    return { ok: true };
  } catch (err) {
    const body = err.response && err.response.body ? JSON.stringify(err.response.body) : err.message;
    console.error(`[ERROR] publishDishToChannel (channel ${channelId}):`, body);
    return { ok: false, reason: 'send_failed' };
  }
}

/** Обработчик кнопки «Опубликовать в канал» (callback admin:publish:<id>). */
async function publishPost(bot, query, lang) {
  const id = Number(query.data.split(':')[2]);
  const { rows } = await db.query('SELECT * FROM menu_items WHERE id = $1', [id]);
  if (!rows.length) {
    await bot.answerCallbackQuery(query.id, { text: t(lang, 'dish_not_found') });
    return;
  }
  const res = await publishDishToChannel(bot, rows[0], lang);
  if (res.ok) {
    await bot.answerCallbackQuery(query.id, { text: t(lang, 'published_ok') });
    console.log(`[INFO] Блюдо #${id} опубликовано в канал`);
  } else if (res.reason === 'no_channel') {
    await bot.answerCallbackQuery(query.id);
    await bot.sendMessage(query.message.chat.id, t(lang, 'channel_not_set'));
  } else {
    await bot.answerCallbackQuery(query.id, { text: t(lang, 'error_generic') });
  }
}

async function generatePost(bot, query, lang) {
  const target = query.data.split(':')[2]; // <id> | 'all'
  await bot.answerCallbackQuery(query.id);
  const chatId = query.message.chat.id;

  await bot.sendMessage(chatId, t(lang, 'post_for_channel'));

  if (target === 'all') {
    const { rows } = await db.query('SELECT * FROM menu_items WHERE is_active = TRUE ORDER BY id');
    for (const item of rows) {
      await sendChannelPost(bot, chatId, item, lang);
    }
    return;
  }

  const { rows } = await db.query('SELECT * FROM menu_items WHERE id = $1', [Number(target)]);
  if (!rows.length) {
    await bot.sendMessage(chatId, t(lang, 'dish_not_found'));
    return;
  }
  await sendChannelPost(bot, chatId, rows[0], lang);
}

module.exports = {
  showAdminPanel,
  showMenuManagement,
  startAddDish,
  handleAddDishStep,
  handleDishCategory,
  dishToggle,
  showEditFields,
  startEditField,
  handleEditCategory,
  handleEditDishStep,
  startUserSearch,
  handleUserSearchStep,
  showRolePicker,
  setUserRole,
  startDeposit,
  handleDepositStep,
  showDepositHistory,
  showOrdersOverview,
  cancelOrderByAdmin,
  showGenPostMenu,
  generatePost,
  publishPost,
  showContacts,
  showSupportSetting,
  startEditContact,
  handleContactStep,
};
