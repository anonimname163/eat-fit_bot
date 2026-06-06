// Смена статуса заказа — общая логика для бота и админ-API Mini App.
// Повторяет поведение cook/courier/admin-обработчиков: уведомления + возврат.
const db = require('../db');
const notify = require('../utils/notify');

// Статусы, которые админ может выставить вручную
const ALLOWED = ['confirmed', 'cooking', 'delivering', 'done', 'cancelled'];

/**
 * Изменить статус заказа и разослать уведомления.
 * При отмене возвращает оплаченное с баланса.
 *
 * @param {import('node-telegram-bot-api')} bot
 * @param {number} orderId
 * @param {string} status один из ALLOWED
 * @returns {Promise<{order: object, refund: number}>}
 * @throws {Error} 'BAD_STATUS' | 'NOT_FOUND' | 'ALREADY_CLOSED'
 */
async function changeStatus(bot, orderId, status) {
  if (!ALLOWED.includes(status)) throw new Error('BAD_STATUS');

  const { rows } = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (!rows.length) throw new Error('NOT_FOUND');
  const order = rows[0];
  if (order.status === 'done' || order.status === 'cancelled') throw new Error('ALREADY_CLOSED');

  // --- Отмена с возвратом средств ---
  if (status === 'cancelled') {
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
    console.log(`[ORDER] Заказ #${orderId} отменён (возврат ${refund})`);
    await notify.notifyClientStatus(bot, updated, 'cancelled');
    await notify.updateAdminGroup(bot, updated);
    return { order: updated, refund };
  }

  // --- Обычная смена статуса ---
  const { rows: u } = await db.query(
    `UPDATE orders SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [orderId, status]
  );
  const updated = u[0];
  console.log(`[ORDER] Заказ #${orderId} → ${status}`);

  if (status === 'delivering') {
    // как в cook.markReady: зовём курьеров; клиента уведомит курьер при взятии
    await notify.notifyCourierGroup(bot, updated);
  } else {
    await notify.notifyClientStatus(bot, updated, status);
  }
  await notify.updateAdminGroup(bot, updated);
  return { order: updated, refund: 0 };
}

module.exports = { changeStatus, ALLOWED };
