// Интерфейс повара.
const db = require('../db');
const { t, esc } = require('../i18n');
const notify = require('../utils/notify');
const { getClient } = require('../middleware/registration');

/** Обновить статус заказа + updated_at. */
async function setStatus(orderId, status, extra = {}) {
  const fields = ['status = $2', 'updated_at = NOW()'];
  const params = [orderId, status];
  if (extra.cook_id !== undefined) {
    params.push(extra.cook_id);
    fields.push(`cook_id = $${params.length}`);
  }
  const { rows } = await db.query(
    `UPDATE orders SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  return rows.length ? rows[0] : null;
}

/** Показать панель повара со списком активных заказов. */
async function showCookPanel(bot, chatId, client) {
  const lang = client.language || 'ru';
  const { rows: orders } = await db.query(
    `SELECT * FROM orders WHERE status IN ('pending','confirmed','cooking') ORDER BY id`
  );

  await bot.sendMessage(chatId, t(lang, 'cook_panel_title'));
  if (!orders.length) {
    await bot.sendMessage(chatId, t(lang, 'cook_no_orders'));
    return;
  }

  for (const order of orders) {
    const items = await notify.getOrderItems(order.id);
    const lines = [`<b>${esc(t(lang, 'order_label'))} #${order.id}</b> — ${esc(t(lang, `status_${order.status}`))}`];
    for (const it of items) {
      const nm = lang === 'uz' ? it.name_uz : it.name_ru;
      lines.push(`• ${esc(nm)} x${it.quantity}`);
    }
    if (order.comment) lines.push(`${esc(t(lang, 'group_comment'))}: ${esc(order.comment)}`);

    const buttons = [];
    if (order.status === 'pending' || order.status === 'confirmed') {
      buttons.push({ text: t(lang, 'btn_take_to_work'), callback_data: `cook:take:${order.id}` });
    }
    if (order.status === 'cooking') {
      buttons.push({ text: t(lang, 'btn_ready'), callback_data: `cook:ready:${order.id}` });
    }

    await bot.sendMessage(chatId, lines.join('\n'), {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [buttons] },
    });
  }
}

/** Принять заказ в работу: pending/confirmed → cooking. */
async function takeToWork(bot, query, actor) {
  const lang = (actor && actor.language) || 'ru';
  const orderId = Number(query.data.split(':')[2]);

  const order = await setStatus(orderId, 'cooking', { cook_id: query.from.id });
  if (!order) {
    await bot.answerCallbackQuery(query.id, { text: t(lang, 'error_generic') });
    return;
  }
  await bot.answerCallbackQuery(query.id, { text: t(lang, 'taken_to_work') });
  console.log(`[ORDER] Заказ #${orderId} взят в работу поваром ${query.from.id}`);

  await notify.notifyClientStatus(bot, order, 'cooking');

  // Обновить сообщение (убрать кнопку «принять», дать «готово»)
  try {
    await bot.editMessageReplyMarkup(
      { inline_keyboard: [[{ text: t(lang, 'btn_ready'), callback_data: `cook:ready:${orderId}` }]] },
      { chat_id: query.message.chat.id, message_id: query.message.message_id }
    );
  } catch (_) { /* сообщение в группе может быть без прав на edit — игнор */ }
}

/** Заказ готов: cooking → delivering, уведомить курьеров. */
async function markReady(bot, query, actor) {
  const lang = (actor && actor.language) || 'ru';
  const orderId = Number(query.data.split(':')[2]);

  const order = await setStatus(orderId, 'delivering');
  if (!order) {
    await bot.answerCallbackQuery(query.id, { text: t(lang, 'error_generic') });
    return;
  }
  await bot.answerCallbackQuery(query.id, { text: t(lang, 'marked_ready') });
  console.log(`[ORDER] Заказ #${orderId} готов, передан курьерам`);

  await notify.notifyClientStatus(bot, order, 'delivering');
  await notify.notifyCourierGroup(bot, order);

  try {
    await bot.editMessageReplyMarkup(
      { inline_keyboard: [] },
      { chat_id: query.message.chat.id, message_id: query.message.message_id }
    );
  } catch (_) { /* игнор */ }
}

module.exports = { showCookPanel, takeToWork, markReady, setStatus };
