// Панель администратора: меню, пользователи, депозиты, заказы, генерация постов.
const db = require('../db');
const { t, dishName, formatMoney, categoryName } = require('../i18n');
const state = require('../state');
const { getClient } = require('../middleware/registration');
const { buildChannelPost, dishDeepLink } = require('../utils/deeplink');

const ROLES = ['client', 'cook', 'courier', 'admin'];

/** Открыть главную панель администратора. */
async function showAdminPanel(bot, chatId, client) {
  const lang = client.language || 'ru';
  await bot.sendMessage(chatId, `*${t(lang, 'admin_panel_title')}*`, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: t(lang, 'admin_menu_mgmt'), callback_data: 'admin:menu' }],
        [{ text: t(lang, 'admin_users'), callback_data: 'admin:users' }],
        [{ text: t(lang, 'admin_deposits'), callback_data: 'admin:deposits' }],
        [{ text: t(lang, 'admin_orders'), callback_data: 'admin:orders' }],
        [{ text: t(lang, 'admin_gen_post'), callback_data: 'admin:genpost' }],
      ],
    },
  });
}

// ==================== Управление меню ====================

async function showMenuManagement(bot, chatId, lang) {
  const { rows } = await db.query('SELECT * FROM menu_items ORDER BY id');
  await bot.sendMessage(chatId, `*${t(lang, 'admin_menu_mgmt')}*`, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[{ text: t(lang, 'btn_add_dish'), callback_data: 'admin:dish:add' }]],
    },
  });

  for (const item of rows) {
    const status = item.is_active ? '🟢' : '🔴';
    const text = `${status} *${dishName(lang, item)}* — ${formatMoney(item.price)} ${t(lang, 'currency')}\n_${categoryName(lang, item.category)}_`;
    const toggleBtn = item.is_active
      ? { text: t(lang, 'btn_hide'), callback_data: `admin:dish:hide:${item.id}` }
      : { text: t(lang, 'btn_show'), callback_data: `admin:dish:show:${item.id}` };
    await bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          toggleBtn,
          { text: t(lang, 'btn_delete'), callback_data: `admin:dish:del:${item.id}` },
        ]],
      },
    });
  }
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
      let photoUrl = null;
      if (msg.photo && msg.photo.length) {
        photoUrl = msg.photo[msg.photo.length - 1].file_id; // лучшее качество
      } else if (msg.text && msg.text.trim() !== '-') {
        photoUrl = msg.text.trim();
      }
      data.photo_url = photoUrl;

      const { rows } = await db.query(
        `INSERT INTO menu_items (name_ru, name_uz, description_ru, description_uz, category, price, photo_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [data.name_ru, data.name_uz, data.description_ru, data.description_uz, data.category, data.price, data.photo_url]
      );
      const item = rows[0];
      state.clearSession(telegramId);
      console.log(`[INFO] Создано блюдо #${item.id} (${item.name_ru})`);

      await bot.sendMessage(chatId, t(lang, 'dish_created'));
      // Сразу выдать deep link и пост для канала
      await bot.sendMessage(chatId, `🔗 ${dishDeepLink(item.id)}`);
      await bot.sendMessage(chatId, buildChannelPost(item, lang));
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
      const item = rows[0];
      const status = item.is_active ? '🟢' : '🔴';
      const text = `${status} *${dishName(lang, item)}* — ${formatMoney(item.price)} ${t(lang, 'currency')}\n_${categoryName(lang, item.category)}_`;
      const toggleBtn = item.is_active
        ? { text: t(lang, 'btn_hide'), callback_data: `admin:dish:hide:${item.id}` }
        : { text: t(lang, 'btn_show'), callback_data: `admin:dish:show:${item.id}` };
      await bot.editMessageText(text, {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[toggleBtn, { text: t(lang, 'btn_delete'), callback_data: `admin:dish:del:${item.id}` }]],
        },
      });
    }
  } catch (_) { /* игнор */ }
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
      `👤 *${u.first_name || ''} ${u.last_name || ''}*`.trim(),
      `ID: \`${u.telegram_id}\``,
      `${t(lang, 'profile_phone')}: ${u.phone || '-'}`,
      `${t(lang, 'profile_balance')}: ${formatMoney(u.balance)} ${t(lang, 'currency')}`,
      `Role: ${u.role}`,
      `${t(lang, 'btn_my_orders')}: ${orderCount[0].c}`,
    ];
    await bot.sendMessage(chatId, lines.join('\n'), {
      parse_mode: 'Markdown',
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

      // Уведомить клиента
      try {
        const { rows } = await db.query('SELECT telegram_id, language FROM clients WHERE id = $1', [clientId]);
        if (rows.length) {
          const c = rows[0];
          await bot.sendMessage(c.telegram_id, `💰 +${formatMoney(amount)} ${t(c.language, 'currency')}`);
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
  const lines = [`*${t(lang, 'deposit_history')}*`];
  for (const d of rows) {
    lines.push(`• ${d.first_name || ''} (${d.phone || '-'}): +${formatMoney(d.amount)} ${t(lang, 'currency')}`);
  }
  await bot.sendMessage(chatId, lines.join('\n'), { parse_mode: 'Markdown' });
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

  const lines = [`*${t(lang, 'admin_orders')}*`, ''];
  for (const r of rows) {
    lines.push(`${t(lang, `status_${r.status}`)}: ${r.c} (${formatMoney(r.sum)} ${t(lang, 'currency')})`);
  }
  lines.push('');
  lines.push('—'.repeat(10));
  for (const o of recent) {
    lines.push(`#${o.id} ${o.first_name || ''} — ${formatMoney(o.total_amount)} ${t(lang, 'currency')} [${t(lang, `status_${o.status}`)}]`);
  }
  await bot.sendMessage(chatId, lines.join('\n'), { parse_mode: 'Markdown' });
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

async function generatePost(bot, query, lang) {
  const target = query.data.split(':')[2]; // <id> | 'all'
  await bot.answerCallbackQuery(query.id);
  const chatId = query.message.chat.id;

  if (target === 'all') {
    const { rows } = await db.query('SELECT * FROM menu_items WHERE is_active = TRUE ORDER BY id');
    for (const item of rows) {
      await bot.sendMessage(chatId, buildChannelPost(item, lang));
    }
    return;
  }

  const { rows } = await db.query('SELECT * FROM menu_items WHERE id = $1', [Number(target)]);
  if (!rows.length) {
    await bot.sendMessage(chatId, t(lang, 'dish_not_found'));
    return;
  }
  await bot.sendMessage(chatId, buildChannelPost(rows[0], lang));
}

module.exports = {
  showAdminPanel,
  showMenuManagement,
  startAddDish,
  handleAddDishStep,
  handleDishCategory,
  dishToggle,
  startUserSearch,
  handleUserSearchStep,
  showRolePicker,
  setUserRole,
  startDeposit,
  handleDepositStep,
  showDepositHistory,
  showOrdersOverview,
  showGenPostMenu,
  generatePost,
};
