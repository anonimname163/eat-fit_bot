// Интерфейс курьера.
const db = require('../db');
const { t, formatMoney, esc } = require('../i18n');
const notify = require('../utils/notify');

/** Показать панель курьера: заказы со статусом delivering. */
async function showCourierPanel(bot, chatId, client) {
  const lang = client.language || 'ru';
  const { rows: orders } = await db.query(
    `SELECT o.*, c.phone FROM orders o
       JOIN clients c ON c.id = o.client_id
      WHERE o.status = 'delivering' ORDER BY o.id`
  );

  await bot.sendMessage(chatId, t(lang, 'courier_panel_title'));
  if (!orders.length) {
    await bot.sendMessage(chatId, t(lang, 'courier_no_orders'));
    return;
  }

  for (const order of orders) {
    const taken = order.courier_id ? `\n👤 (взят)` : '';
    const lines = [
      `<b>${esc(t(lang, 'order_label'))} #${order.id}</b>`,
      `${esc(t(lang, 'group_address'))}: ${esc(order.delivery_address || '-')}`,
      `${esc(t(lang, 'group_phone'))}: ${esc(order.phone || '-')}`,
      `💵 ${esc(formatMoney(order.total_amount))} ${esc(t(lang, 'currency'))}${taken}`,
    ];

    const buttons = [];
    if (!order.courier_id) {
      buttons.push({ text: t(lang, 'btn_take_delivery'), callback_data: `courier:take:${order.id}` });
    } else {
      buttons.push({ text: t(lang, 'btn_delivered'), callback_data: `courier:done:${order.id}` });
    }

    await bot.sendMessage(chatId, lines.join('\n'), {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [buttons] },
    });
  }
}

/** Взять доставку: закрепить курьера за заказом. */
async function takeDelivery(bot, query, actor) {
  const lang = (actor && actor.language) || 'ru';
  const orderId = Number(query.data.split(':')[2]);

  const { rows } = await db.query(
    `UPDATE orders SET courier_id = $2, updated_at = NOW()
      WHERE id = $1 AND courier_id IS NULL RETURNING *`,
    [orderId, query.from.id]
  );

  if (!rows.length) {
    // Уже кто-то взял
    await bot.answerCallbackQuery(query.id, { text: t(lang, 'courier_no_orders') });
    return;
  }
  await bot.answerCallbackQuery(query.id, { text: t(lang, 'delivery_taken') });
  console.log(`[ORDER] Заказ #${orderId} взят курьером ${query.from.id}`);

  try {
    await bot.editMessageReplyMarkup(
      { inline_keyboard: [[{ text: t(lang, 'btn_delivered'), callback_data: `courier:done:${orderId}` }]] },
      { chat_id: query.message.chat.id, message_id: query.message.message_id }
    );
  } catch (_) { /* игнор */ }
}

/** Доставлено: delivering → done. */
async function markDelivered(bot, query, actor) {
  const lang = (actor && actor.language) || 'ru';
  const orderId = Number(query.data.split(':')[2]);

  const { rows } = await db.query(
    `UPDATE orders SET status = 'done', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [orderId]
  );
  if (!rows.length) {
    await bot.answerCallbackQuery(query.id, { text: t(lang, 'error_generic') });
    return;
  }
  await bot.answerCallbackQuery(query.id, { text: t(lang, 'delivery_done') });
  console.log(`[ORDER] Заказ #${orderId} доставлен курьером ${query.from.id}`);

  await notify.notifyClientStatus(bot, rows[0], 'done');

  try {
    await bot.editMessageReplyMarkup(
      { inline_keyboard: [] },
      { chat_id: query.message.chat.id, message_id: query.message.message_id }
    );
  } catch (_) { /* игнор */ }
}

module.exports = { showCourierPanel, takeDelivery, markDelivered };
