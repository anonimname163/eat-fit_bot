// Бизнес-логика создания заказа — общая для бота и веб-API (Mini App).
// Гарантирует одинаковую транзакцию (списание баланса, позиции) и уведомления.
const db = require('../db');
const notify = require('../utils/notify');

/**
 * Создать заказ в одной транзакции и разослать уведомления.
 *
 * Цены берутся из БД (не доверяем клиенту), считаются только активные блюда.
 *
 * @param {import('node-telegram-bot-api')} bot инстанс бота (для уведомлений)
 * @param {object} client строка clients (нужны id, address)
 * @param {Array<{itemId:number, quantity:number}>} lines позиции заказа
 * @param {{payFromBalance?: boolean, comment?: string|null}} [opts]
 * @returns {Promise<object>} строка созданного заказа
 * @throws {Error} 'EMPTY_CART' | 'ITEM_NOT_FOUND' | 'INSUFFICIENT_BALANCE'
 */
async function placeOrder(bot, client, lines, opts = {}) {
  const payFromBalance = Boolean(opts.payFromBalance);
  const comment = opts.comment ? String(opts.comment).trim() || null : null;

  const order = await db.withTransaction(async (tx) => {
    // Нормализуем позиции и подтягиваем актуальные цены из БД
    const clean = [];
    for (const l of Array.isArray(lines) ? lines : []) {
      const qty = Math.floor(Number(l && l.quantity));
      const itemId = Number(l && l.itemId);
      if (!itemId || !qty || qty < 1) continue;
      const { rows } = await tx.query(
        'SELECT id, price FROM menu_items WHERE id = $1 AND is_active = TRUE',
        [itemId]
      );
      if (!rows.length) throw new Error('ITEM_NOT_FOUND');
      clean.push({ id: rows[0].id, price: Number(rows[0].price), quantity: qty });
    }
    if (!clean.length) throw new Error('EMPTY_CART');

    const total = clean.reduce((s, l) => s + l.price * l.quantity, 0);

    // Блокируем строку клиента, перечитываем баланс/адрес
    const { rows: cl } = await tx.query(
      'SELECT id, balance, address FROM clients WHERE id = $1 FOR UPDATE',
      [client.id]
    );
    if (!cl.length) throw new Error('ITEM_NOT_FOUND');
    const fresh = cl[0];

    let paidFromBalance = 0;
    if (payFromBalance) {
      if (Number(fresh.balance) < total) throw new Error('INSUFFICIENT_BALANCE');
      paidFromBalance = total;
      await tx.query(
        'UPDATE clients SET balance = balance - $1 WHERE id = $2',
        [paidFromBalance, client.id]
      );
    }

    const { rows: orderRows } = await tx.query(
      `INSERT INTO orders (client_id, status, total_amount, paid_from_balance, delivery_address, comment)
       VALUES ($1, 'pending', $2, $3, $4, $5)
       RETURNING *`,
      [client.id, total, paidFromBalance, fresh.address, comment]
    );
    const newOrder = orderRows[0];

    for (const l of clean) {
      await tx.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_order)
         VALUES ($1, $2, $3, $4)`,
        [newOrder.id, l.id, l.quantity, l.price]
      );
    }

    return newOrder;
  });

  console.log(`[ORDER] Создан заказ #${order.id} (client ${client.id}) на сумму ${order.total_amount}`);

  // Уведомления — вне транзакции, ошибки не должны откатывать заказ
  try {
    await notify.notifyCookGroup(bot, order);
    await notify.notifyAdminGroup(bot, order);
  } catch (err) {
    console.error('[ERROR] placeOrder notify:', err.message);
  }

  return order;
}

module.exports = { placeOrder };
