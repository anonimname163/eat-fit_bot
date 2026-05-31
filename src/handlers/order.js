// Процесс заказа: карточка блюда, корзина, оформление, транзакция создания заказа.
const db = require('../db');
const { t, dishName, dishDesc, formatMoney, categoryName } = require('../i18n');
const state = require('../state');
const kb = require('../keyboards');
const menu = require('./menu');
const { getClient } = require('../middleware/registration');
const notify = require('../utils/notify');

/**
 * Открыть карточку конкретного блюда (deep link или из меню).
 */
async function openDishCard(bot, chatId, client, itemId) {
  const lang = client.language || 'ru';
  const item = await menu.getActiveItem(itemId);
  if (!item) {
    await bot.sendMessage(chatId, t(lang, 'dish_not_found'));
    return;
  }

  const name = dishName(lang, item);
  const desc = dishDesc(lang, item);
  const price = `${formatMoney(item.price)} ${t(lang, 'currency')}`;
  let text = `🍽 *${name}*\n`;
  if (desc) text += `${desc}\n`;
  text += `💵 ${price}`;

  const opts = { parse_mode: 'Markdown', ...kb.dishCardKeyboard(lang, item.id) };

  if (item.photo_url) {
    try {
      await bot.sendPhoto(chatId, item.photo_url, { caption: text, ...opts });
      return;
    } catch (err) {
      console.error('[ERROR] sendPhoto карточки:', err.message);
    }
  }
  await bot.sendMessage(chatId, text, opts);
}

/**
 * Начать обычный заказ (кнопка «Сделать заказ»): показать меню.
 */
async function startOrder(bot, chatId, client) {
  await menu.showMenu(bot, chatId, client);
  const lang = client.language || 'ru';
  await bot.sendMessage(chatId, t(lang, 'add_something_else'), kb.addMoreKeyboard(lang));
}

/**
 * Добавить блюдо в корзину (callback cart:add:<id>).
 */
async function addToCart(bot, query, client) {
  const chatId = query.message.chat.id;
  const lang = client.language || 'ru';
  const itemId = Number(query.data.split(':')[2]);

  const item = await menu.getActiveItem(itemId);
  if (!item) {
    await bot.answerCallbackQuery(query.id, { text: t(lang, 'dish_not_found') });
    return;
  }

  state.addToCart(client.telegram_id, item);
  await bot.answerCallbackQuery(query.id, { text: t(lang, 'added_to_cart') });
  await bot.sendMessage(chatId, t(lang, 'add_something_else'), kb.addMoreKeyboard(lang));
}

/**
 * Показать список блюд категории для добавления (callback cart:cat:<category>).
 */
async function showCategory(bot, query, client) {
  const chatId = query.message.chat.id;
  const lang = client.language || 'ru';
  const category = query.data.split(':')[2];

  const items = await menu.activeItemsByCategory(category);
  await bot.answerCallbackQuery(query.id);

  if (!items.length) {
    await bot.sendMessage(chatId, t(lang, 'menu_empty'));
    return;
  }

  await bot.sendMessage(chatId, `*${categoryName(lang, category)}*`, { parse_mode: 'Markdown' });
  for (const item of items) {
    const name = dishName(lang, item);
    const price = `${formatMoney(item.price)} ${t(lang, 'currency')}`;
    const text = `🍽 *${name}* — ${price}`;
    await bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: t(lang, 'btn_add_to_cart'), callback_data: `cart:add:${item.id}` },
        ]],
      },
    });
  }
  await bot.sendMessage(chatId, t(lang, 'add_something_else'), kb.addMoreKeyboard(lang));
}

/**
 * Собрать текст корзины.
 */
function renderCart(lang, cart, client) {
  const lines = [`🛒 *${t(lang, 'cart_title')}*`, ''];
  for (const { item, quantity } of cart.items.values()) {
    const name = dishName(lang, item);
    const sum = formatMoney(Number(item.price) * quantity);
    lines.push(`• ${name} x${quantity} — ${sum} ${t(lang, 'currency')}`);
  }
  const total = state.cartTotal(cart);
  lines.push('');
  lines.push(`💵 *${t(lang, 'cart_total')}: ${formatMoney(total)} ${t(lang, 'currency')}*`);
  lines.push(`📍 ${t(lang, 'cart_address')}: ${client.address || '-'}`);
  lines.push(`💰 ${t(lang, 'profile_balance')}: ${formatMoney(client.balance)} ${t(lang, 'currency')}`);
  return lines.join('\n');
}

/**
 * Оформление заказа (callback cart:checkout): спросить комментарий.
 */
async function checkout(bot, query, client) {
  const chatId = query.message.chat.id;
  const lang = client.language || 'ru';
  const cart = state.getCart(client.telegram_id);

  await bot.answerCallbackQuery(query.id);

  if (state.cartIsEmpty(cart)) {
    await bot.sendMessage(chatId, t(lang, 'cart_empty'));
    return;
  }

  // Запросим комментарий, затем покажем подтверждение
  state.setSession(client.telegram_id, 'checkout', 'comment', {});
  await bot.sendMessage(chatId, t(lang, 'ask_comment'));
}

/**
 * Шаг ввода комментария к заказу (текст). Возвращает true если обработан.
 */
async function handleCheckoutStep(bot, msg) {
  const telegramId = msg.from.id;
  const chatId = msg.chat.id;
  const session = state.getSession(telegramId);
  if (!session || session.flow !== 'checkout') return false;

  const client = await getClient(telegramId);
  const lang = (client && client.language) || 'ru';
  const cart = state.getCart(telegramId);

  if (state.cartIsEmpty(cart)) {
    state.clearSession(telegramId);
    await bot.sendMessage(chatId, t(lang, 'cart_empty'));
    return true;
  }

  if (session.step === 'comment') {
    const comment = (msg.text || '').trim();
    cart.comment = comment === '-' ? null : comment;
    state.clearSession(telegramId);

    // Показать подтверждение с выбором оплаты
    const total = state.cartTotal(cart);
    const text = renderCart(lang, cart, client);
    const buttons = [];
    if (Number(client.balance) >= total) {
      buttons.push([{ text: t(lang, 'btn_pay_balance'), callback_data: 'order:pay:balance' }]);
    }
    buttons.push([{ text: t(lang, 'btn_pay_cash'), callback_data: 'order:pay:cash' }]);
    buttons.push([{ text: t(lang, 'btn_cancel'), callback_data: 'order:cancel' }]);

    await bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: buttons },
    });
    return true;
  }
  return false;
}

/**
 * Выбор способа оплаты (callback order:pay:balance|cash) → подтверждение.
 */
async function choosePayment(bot, query, client) {
  const chatId = query.message.chat.id;
  const lang = client.language || 'ru';
  const method = query.data.split(':')[2];
  const cart = state.getCart(client.telegram_id);

  await bot.answerCallbackQuery(query.id);
  if (state.cartIsEmpty(cart)) {
    await bot.sendMessage(chatId, t(lang, 'cart_empty'));
    return;
  }

  cart.payFromBalance = method === 'balance';

  await bot.sendMessage(chatId, renderCart(lang, cart, client), {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: t(lang, 'btn_confirm_order'), callback_data: 'order:confirm' }],
        [{ text: t(lang, 'btn_cancel'), callback_data: 'order:cancel' }],
      ],
    },
  });
}

/**
 * Подтверждение заказа (callback order:confirm): создать заказ в транзакции.
 */
async function confirmOrder(bot, query, client) {
  const chatId = query.message.chat.id;
  const lang = client.language || 'ru';
  const telegramId = client.telegram_id;
  const cart = state.getCart(telegramId);

  await bot.answerCallbackQuery(query.id);
  if (state.cartIsEmpty(cart)) {
    await bot.sendMessage(chatId, t(lang, 'cart_empty'));
    return;
  }

  const total = state.cartTotal(cart);
  const cartItems = [...cart.items.values()];

  try {
    const order = await db.withTransaction(async (tx) => {
      // Перечитываем баланс внутри транзакции (актуальность)
      const { rows: cl } = await tx.query(
        'SELECT id, balance FROM clients WHERE id = $1 FOR UPDATE',
        [client.id]
      );
      const fresh = cl[0];
      let paidFromBalance = 0;

      if (cart.payFromBalance) {
        if (Number(fresh.balance) < total) {
          throw new Error('INSUFFICIENT_BALANCE');
        }
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
        [client.id, total, paidFromBalance, client.address, cart.comment]
      );
      const newOrder = orderRows[0];

      for (const { item, quantity } of cartItems) {
        await tx.query(
          `INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_order)
           VALUES ($1, $2, $3, $4)`,
          [newOrder.id, item.id, quantity, item.price]
        );
      }

      return newOrder;
    });

    state.clearCart(telegramId);
    console.log(`[ORDER] Создан заказ #${order.id} клиентом ${telegramId} на сумму ${total}`);

    await bot.sendMessage(
      chatId,
      `✅ ${t(lang, 'order_created')} #${order.id}`,
      { reply_markup: { remove_keyboard: false } }
    );

    // Уведомить поваров
    await notify.notifyCookGroup(bot, order);
  } catch (err) {
    if (err.message === 'INSUFFICIENT_BALANCE') {
      await bot.sendMessage(chatId, t(lang, 'btn_pay_cash'));
    } else {
      console.error('[ERROR] confirmOrder:', err);
      await bot.sendMessage(chatId, t(lang, 'error_generic'));
    }
  }
}

/**
 * Отмена оформления (callback order:cancel или cart:decline).
 */
async function cancelOrder(bot, query, client) {
  const chatId = query.message.chat.id;
  const lang = client.language || 'ru';
  await bot.answerCallbackQuery(query.id);
  state.clearCart(client.telegram_id);
  state.clearSession(client.telegram_id);
  await bot.sendMessage(chatId, t(lang, 'order_cancelled_msg'));
}

/**
 * Показать «Мои заказы».
 */
async function showMyOrders(bot, chatId, client) {
  const lang = client.language || 'ru';
  const { rows: orders } = await db.query(
    `SELECT * FROM orders WHERE client_id = $1 ORDER BY id DESC LIMIT 10`,
    [client.id]
  );

  if (!orders.length) {
    await bot.sendMessage(chatId, t(lang, 'no_orders'));
    return;
  }

  await bot.sendMessage(chatId, `*${t(lang, 'my_orders_title')}*`, { parse_mode: 'Markdown' });

  for (const order of orders) {
    const items = await notify.getOrderItems(order.id);
    const lines = [`*${t(lang, 'order_label')} #${order.id}*`];
    for (const it of items) {
      const nm = lang === 'uz' ? it.name_uz : it.name_ru;
      lines.push(`• ${nm} x${it.quantity}`);
    }
    lines.push(`💵 ${formatMoney(order.total_amount)} ${t(lang, 'currency')}`);
    lines.push(`📦 ${t(lang, 'status_label')}: ${t(lang, `status_${order.status}`)}`);
    await bot.sendMessage(chatId, lines.join('\n'), { parse_mode: 'Markdown' });
  }
}

module.exports = {
  openDishCard,
  startOrder,
  addToCart,
  showCategory,
  checkout,
  handleCheckoutStep,
  choosePayment,
  confirmOrder,
  cancelOrder,
  showMyOrders,
  renderCart,
};
