// Отправка уведомлений: клиенту о статусе, в группы поваров/курьеров/админов.
const db = require('../db');
const { t, dishName, formatMoney, esc } = require('../i18n');

/**
 * Текущее время в формате HH:MM (по серверу).
 */
function nowHM() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Получить позиции заказа с данными блюд.
 * @param {number} orderId
 */
async function getOrderItems(orderId) {
  const { rows } = await db.query(
    `SELECT oi.quantity, oi.price_at_order, m.name_ru, m.name_uz, m.category
       FROM order_items oi
       JOIN menu_items m ON m.id = oi.menu_item_id
      WHERE oi.order_id = $1
      ORDER BY oi.id`,
    [orderId]
  );
  return rows;
}

/**
 * Уведомить клиента о смене статуса заказа.
 * @param {import('node-telegram-bot-api')} bot
 * @param {object} order строка orders
 * @param {string} status новый статус
 */
async function notifyClientStatus(bot, order, status) {
  try {
    const { rows } = await db.query(
      'SELECT telegram_id, language FROM clients WHERE id = $1',
      [order.client_id]
    );
    if (!rows.length) return;
    const client = rows[0];
    const keyMap = {
      confirmed: 'notify_confirmed',
      cooking: 'notify_cooking',
      delivering: 'notify_delivering',
      done: 'notify_done',
      cancelled: 'notify_cancelled',
    };
    const key = keyMap[status];
    if (!key) return;
    const text = `${t(client.language, 'order_label')} #${order.id}\n${t(client.language, key)}`;
    await bot.sendMessage(client.telegram_id, text);
  } catch (err) {
    console.error('[ERROR] notifyClientStatus:', err.message);
  }
}

/**
 * Отправить новый заказ в группу поваров.
 * @param {import('node-telegram-bot-api')} bot
 * @param {object} order
 */
async function notifyCookGroup(bot, order) {
  const groupId = process.env.COOK_GROUP_ID;
  if (!groupId) {
    console.log('[INFO] COOK_GROUP_ID не задан, пропускаю уведомление поварам');
    return;
  }
  try {
    const items = await getOrderItems(order.id);
    const lines = [];
    lines.push(`🆕 ${t('ru', 'group_new_order')} #${order.id}`);
    lines.push('─────────────────');
    for (const it of items) {
      const emoji = it.category === 'drink' ? '🥤' : it.category === 'dessert' ? '🍰' : '🍲';
      lines.push(`${emoji} ${it.name_ru} x${it.quantity}`);
    }
    lines.push('─────────────────');
    if (order.comment) lines.push(`${t('ru', 'group_comment')}: ${order.comment}`);
    lines.push(`⏰ ${nowHM()}`);

    await bot.sendMessage(groupId, lines.join('\n'), {
      reply_markup: {
        inline_keyboard: [[
          { text: t('ru', 'btn_take_to_work'), callback_data: `cook:take:${order.id}` },
        ]],
      },
    });
    console.log(`[ORDER] Заказ #${order.id} отправлен поварам (group ${groupId})`);
  } catch (err) {
    const body = err.response && err.response.body ? JSON.stringify(err.response.body) : err.message;
    console.error(`[ERROR] notifyCookGroup (group ${groupId}):`, body);
  }
}

/**
 * Отправить готовый заказ в группу курьеров.
 * @param {import('node-telegram-bot-api')} bot
 * @param {object} order
 */
async function notifyCourierGroup(bot, order) {
  const groupId = process.env.COURIER_GROUP_ID;
  if (!groupId) {
    console.log('[INFO] COURIER_GROUP_ID не задан, пропускаю уведомление курьерам');
    return;
  }
  try {
    const { rows } = await db.query(
      'SELECT phone FROM clients WHERE id = $1',
      [order.client_id]
    );
    const phone = rows.length ? rows[0].phone : '';
    const lines = [];
    lines.push(`📦 ${t('ru', 'order_label')} #${order.id} ${t('ru', 'group_ready_delivery')}`);
    lines.push(`${t('ru', 'group_address')}: ${order.delivery_address || '-'}`);
    lines.push(`${t('ru', 'group_phone')}: ${phone || '-'}`);
    lines.push(`⏰ ${nowHM()}`);

    await bot.sendMessage(groupId, lines.join('\n'), {
      reply_markup: {
        inline_keyboard: [[
          { text: t('ru', 'btn_take_delivery'), callback_data: `courier:take:${order.id}` },
        ]],
      },
    });
    console.log(`[ORDER] Заказ #${order.id} отправлен курьерам (group ${groupId})`);
  } catch (err) {
    const body = err.response && err.response.body ? JSON.stringify(err.response.body) : err.message;
    console.error(`[ERROR] notifyCourierGroup (group ${groupId}):`, body);
  }
}

/** Эмодзи статуса для наглядности в админ-группе. */
function statusEmoji(status) {
  return {
    pending: '🆕',
    confirmed: '✅',
    cooking: '👨‍🍳',
    delivering: '🚗',
    done: '✅',
    cancelled: '❌',
  }[status] || '•';
}

/** Собрать карточку заказа для админ-группы (HTML). */
async function renderAdminOrderCard(order) {
  const { rows: cl } = await db.query(
    'SELECT first_name, last_name, phone FROM clients WHERE id = $1',
    [order.client_id]
  );
  const c = cl[0] || {};
  const items = await getOrderItems(order.id);

  const lines = [];
  lines.push(`📋 <b>${t('ru', 'order_label')} #${order.id}</b>`);
  lines.push(`${statusEmoji(order.status)} <b>${esc(t('ru', `status_${order.status}`))}</b>`);
  lines.push('─────────────────');
  lines.push(`👤 ${esc(`${c.first_name || ''} ${c.last_name || ''}`.trim() || '-')}`);
  lines.push(`📞 ${esc(c.phone || '-')}`);
  lines.push(`📍 ${esc(order.delivery_address || '-')}`);
  lines.push('─────────────────');
  for (const it of items) {
    const emoji = it.category === 'drink' ? '🥤' : it.category === 'dessert' ? '🍰' : '🍲';
    lines.push(`${emoji} ${esc(it.name_ru)} x${it.quantity}`);
  }
  lines.push('─────────────────');
  if (order.comment) lines.push(`📝 ${esc(order.comment)}`);
  if (order.cook_id) lines.push(`👨‍🍳 повар взял`);
  if (order.courier_id) lines.push(`🚗 курьер взял`);
  lines.push(`💵 <b>${esc(formatMoney(order.total_amount))} ${esc(t('ru', 'currency'))}</b>`);
  lines.push(`⏰ ${nowHM()}`);
  return lines.join('\n');
}

/**
 * Отправить новый заказ в админ-группу и запомнить message_id для обновлений.
 */
async function notifyAdminGroup(bot, order) {
  const groupId = process.env.ADMIN_GROUP_ID;
  if (!groupId) {
    console.log('[INFO] ADMIN_GROUP_ID не задан, пропускаю карточку для админ-группы');
    return;
  }
  try {
    const text = await renderAdminOrderCard(order);
    const sent = await bot.sendMessage(groupId, text, { parse_mode: 'HTML' });
    await db.query('UPDATE orders SET admin_msg_id = $1 WHERE id = $2', [sent.message_id, order.id]);
    console.log(`[ORDER] Заказ #${order.id} отправлен в админ-группу (group ${groupId})`);
  } catch (err) {
    const body = err.response && err.response.body ? JSON.stringify(err.response.body) : err.message;
    console.error(`[ERROR] notifyAdminGroup (group ${groupId}):`, body);
  }
}

/**
 * Обновить карточку заказа в админ-группе в реальном времени.
 * Если сообщения ещё нет — отправить новое.
 */
async function updateAdminGroup(bot, order) {
  const groupId = process.env.ADMIN_GROUP_ID;
  if (!groupId || !order) return;
  try {
    const text = await renderAdminOrderCard(order);
    if (order.admin_msg_id) {
      await bot.editMessageText(text, {
        chat_id: groupId,
        message_id: Number(order.admin_msg_id),
        parse_mode: 'HTML',
      });
    } else {
      await notifyAdminGroup(bot, order);
    }
  } catch (err) {
    const body = err.response && err.response.body ? JSON.stringify(err.response.body) : err.message;
    console.error(`[ERROR] updateAdminGroup (order ${order.id}):`, body);
  }
}

module.exports = {
  nowHM,
  getOrderItems,
  notifyClientStatus,
  notifyCookGroup,
  notifyCourierGroup,
  notifyAdminGroup,
  updateAdminGroup,
};
