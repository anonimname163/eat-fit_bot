// Процесс заказа: карточка блюда, корзина, оформление, транзакция создания заказа.
const db = require('../db');
const { t, dishName, dishDesc, formatMoney, categoryName, esc } = require('../i18n');
const state = require('../state');
const kb = require('../keyboards');
const menu = require('./menu');
const { getClient } = require('../middleware/registration');
const notify = require('../utils/notify');
const orderService = require('../services/orders');

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
  let text = `🍽 <b>${esc(name)}</b>\n`;
  if (desc) text += `${esc(desc)}\n`;
  text += `💵 ${esc(price)}`;

  const qty = state.getQuantity(client.telegram_id, item.id);
  const opts = {
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [kb.stepperRow(lang, item.id, qty)] },
  };

  if (item.photo_url) {
    try {
      await bot.sendPhoto(chatId, item.photo_url, { caption: text, ...opts });
      return;
    } catch (err) {
      const body = err.response && err.response.body ? JSON.stringify(err.response.body) : err.message;
      console.error('[ERROR] sendPhoto карточки (item', item.id, '):', body);
      await menu.clearInvalidPhoto(item.id, body);
    }
  }
  await bot.sendMessage(chatId, text, opts);
}

/**
 * Собрать «живую» панель корзины: текст с количеством каждого блюда + кнопки.
 */
function buildCartPanel(lang, cart) {
  const lines = [`🛒 <b>${esc(t(lang, 'cart_title'))}</b>`, ''];
  if (state.cartIsEmpty(cart)) {
    lines.push(esc(t(lang, 'cart_empty')));
  } else {
    for (const { item, quantity } of cart.items.values()) {
      const sum = formatMoney(Number(item.price) * quantity);
      lines.push(`• ${esc(dishName(lang, item))} — ${quantity} ${esc(t(lang, 'pcs'))} × ${esc(formatMoney(item.price))} = ${esc(sum)} ${esc(t(lang, 'currency'))}`);
    }
    lines.push('');
    lines.push(`💵 <b>${esc(t(lang, 'cart_total'))}: ${esc(formatMoney(state.cartTotal(cart)))} ${esc(t(lang, 'currency'))}</b>`);
  }

  const keyboard = [
    [
      { text: t(lang, 'btn_drinks'), callback_data: 'cart:cat:drink' },
      { text: t(lang, 'btn_desserts'), callback_data: 'cart:cat:dessert' },
    ],
  ];
  if (!state.cartIsEmpty(cart)) {
    keyboard.push([{ text: t(lang, 'btn_checkout'), callback_data: 'cart:checkout' }]);
  }
  return { text: lines.join('\n'), keyboard };
}

/**
 * Отправить новую панель корзины внизу (старую удалить, если была).
 */
async function sendCartPanel(bot, chatId, client) {
  const lang = client.language || 'ru';
  const cart = state.getCart(client.telegram_id);
  if (cart.panelMessageId && cart.panelChatId) {
    try { await bot.deleteMessage(cart.panelChatId, cart.panelMessageId); } catch (_) { /* игнор */ }
  }
  const { text, keyboard } = buildCartPanel(lang, cart);
  const sent = await bot.sendMessage(chatId, text, {
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: keyboard },
  });
  cart.panelMessageId = sent.message_id;
  cart.panelChatId = chatId;
}

/**
 * Обновить существующую панель корзины на месте (без нового сообщения).
 */
async function updateCartPanel(bot, chatId, client) {
  const lang = client.language || 'ru';
  const cart = state.getCart(client.telegram_id);
  if (!cart.panelMessageId) {
    await sendCartPanel(bot, chatId, client);
    return;
  }
  const { text, keyboard } = buildCartPanel(lang, cart);
  try {
    await bot.editMessageText(text, {
      chat_id: cart.panelChatId,
      message_id: cart.panelMessageId,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: keyboard },
    });
  } catch (_) {
    // Сообщение нельзя отредактировать (удалено/устарело) — отправим заново
    await sendCartPanel(bot, chatId, client);
  }
}

/**
 * Начать обычный заказ (кнопка «Сделать заказ»): показать меню + панель корзины.
 */
async function startOrder(bot, chatId, client) {
  await menu.showMenu(bot, chatId, client);
  await sendCartPanel(bot, chatId, client);
}

/**
 * Переход по deep link: сразу кладём выбранное блюдо в количестве 1
 * и открываем меню с панелью корзины.
 */
async function openDishFromDeepLink(bot, chatId, client, itemId) {
  const lang = client.language || 'ru';
  const item = await menu.getActiveItem(itemId);

  if (item) {
    // Кладём блюдо в количестве 1 (если его ещё нет в корзине)
    if (state.getQuantity(client.telegram_id, item.id) === 0) {
      state.incQuantity(client.telegram_id, item);
    }
    await bot.sendMessage(
      chatId,
      `✅ ${esc(t(lang, 'added_to_cart'))}: <b>${esc(dishName(lang, item))}</b>`,
      { parse_mode: 'HTML' }
    );
  } else {
    await bot.sendMessage(chatId, t(lang, 'dish_not_found'));
  }

  // Открываем меню и живую панель корзины (выбранное блюдо уже «1 шт»)
  await menu.showMenu(bot, chatId, client);
  await sendCartPanel(bot, chatId, client);
}

/**
 * Добавить блюдо в корзину (callback cart:add:<id>) — обновляем панель на месте.
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
  await updateCartPanel(bot, chatId, client);
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

  await bot.sendMessage(chatId, `<b>${esc(categoryName(lang, category))}</b>`, { parse_mode: 'HTML' });
  for (const item of items) {
    const name = dishName(lang, item);
    const price = `${formatMoney(item.price)} ${t(lang, 'currency')}`;
    const text = `🍽 <b>${esc(name)}</b> — ${esc(price)}`;
    const qty = state.getQuantity(client.telegram_id, item.id);
    await bot.sendMessage(chatId, text, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [kb.stepperRow(lang, item.id, qty)] },
    });
  }
  // Свежая панель корзины внизу, чтобы кнопки оформления были под рукой
  await sendCartPanel(bot, chatId, client);
}

/**
 * Обработка степпера количества (callback qty:inc|dec|noop:<id>).
 * Меняет количество в корзине, обновляет кнопку под блюдом и панель корзины.
 */
async function handleQty(bot, query, client) {
  const lang = client.language || 'ru';
  const chatId = query.message.chat.id;
  const parts = query.data.split(':'); // qty:inc|dec|noop:<id>
  const action = parts[1];

  if (action === 'noop') {
    await bot.answerCallbackQuery(query.id);
    return;
  }

  const itemId = Number(parts[2]);

  if (action === 'inc') {
    const item = await menu.getActiveItem(itemId);
    if (!item) {
      await bot.answerCallbackQuery(query.id, { text: t(lang, 'dish_not_found') });
      return;
    }
    state.incQuantity(client.telegram_id, item);
  } else if (action === 'dec') {
    state.decQuantity(client.telegram_id, itemId);
  }

  const qty = state.getQuantity(client.telegram_id, itemId);
  await bot.answerCallbackQuery(query.id);

  // Обновить кнопку-степпер под этим блюдом на месте
  try {
    await bot.editMessageReplyMarkup(
      { inline_keyboard: [kb.stepperRow(lang, itemId, qty)] },
      { chat_id: chatId, message_id: query.message.message_id }
    );
  } catch (_) { /* игнор: разметка не изменилась */ }

  // Обновить «живую» панель корзины
  await updateCartPanel(bot, chatId, client);
}

/**
 * Собрать текст корзины.
 */
function renderCart(lang, cart, client) {
  const lines = [`🛒 <b>${esc(t(lang, 'cart_title'))}</b>`, ''];
  for (const { item, quantity } of cart.items.values()) {
    const name = dishName(lang, item);
    const sum = formatMoney(Number(item.price) * quantity);
    lines.push(`• ${esc(name)} x${quantity} — ${esc(sum)} ${esc(t(lang, 'currency'))}`);
  }
  const total = state.cartTotal(cart);
  lines.push('');
  lines.push(`💵 <b>${esc(t(lang, 'cart_total'))}: ${esc(formatMoney(total))} ${esc(t(lang, 'currency'))}</b>`);
  lines.push(`📍 ${esc(t(lang, 'cart_address'))}: ${esc(client.address || '-')}`);
  lines.push(`💰 ${esc(t(lang, 'profile_balance'))}: ${esc(formatMoney(client.balance))} ${esc(t(lang, 'currency'))}`);
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

  // Панель корзины больше не нужна — убираем её
  if (cart.panelMessageId && cart.panelChatId) {
    try { await bot.deleteMessage(cart.panelChatId, cart.panelMessageId); } catch (_) { /* игнор */ }
    cart.panelMessageId = null;
  }

  // Запросим комментарий (можно пропустить кнопкой), затем покажем подтверждение
  state.setSession(client.telegram_id, 'checkout', 'comment', {});
  await bot.sendMessage(chatId, t(lang, 'ask_comment'), {
    reply_markup: {
      inline_keyboard: [[{ text: t(lang, 'btn_no_comment'), callback_data: 'order:nocomment' }]],
    },
  });
}

/**
 * Показать подтверждение заказа с выбором способа оплаты.
 */
async function proceedToPayment(bot, chatId, client) {
  const lang = client.language || 'ru';
  const cart = state.getCart(client.telegram_id);
  const total = state.cartTotal(cart);
  const text = renderCart(lang, cart, client);

  const buttons = [];
  if (Number(client.balance) >= total) {
    buttons.push([{ text: t(lang, 'btn_pay_balance'), callback_data: 'order:pay:balance' }]);
  }
  buttons.push([{ text: t(lang, 'btn_pay_cash'), callback_data: 'order:pay:cash' }]);
  buttons.push([{ text: t(lang, 'btn_cancel'), callback_data: 'order:cancel' }]);

  console.log(`[ORDER] Клиент ${client.telegram_id} перешёл к оплате (позиций: ${cart.items.size}, сумма: ${total})`);
  await bot.sendMessage(chatId, text, {
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: buttons },
  });
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
    await proceedToPayment(bot, chatId, client);
    return true;
  }
  return false;
}

/**
 * Пропустить комментарий (callback order:nocomment) → сразу к оплате.
 */
async function skipComment(bot, query, client) {
  const chatId = query.message.chat.id;
  const lang = client.language || 'ru';
  const cart = state.getCart(client.telegram_id);

  await bot.answerCallbackQuery(query.id);
  if (state.cartIsEmpty(cart)) {
    await bot.sendMessage(chatId, t(lang, 'cart_empty'));
    return;
  }
  cart.comment = null;
  state.clearSession(client.telegram_id);
  // Убрать кнопку «Без комментария» с предыдущего сообщения
  try {
    await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: query.message.message_id });
  } catch (_) { /* игнор */ }
  await proceedToPayment(bot, chatId, client);
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
    parse_mode: 'HTML',
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
  console.log(`[ORDER] confirmOrder: клиент ${telegramId}, позиций ${cartItems.length}, сумма ${total}, оплата ${cart.payFromBalance ? 'баланс' : 'наличные'}`);

  try {
    const lines = cartItems.map(({ item, quantity }) => ({ itemId: item.id, quantity }));
    const order = await orderService.placeOrder(bot, client, lines, {
      payFromBalance: cart.payFromBalance,
      comment: cart.comment,
    });

    state.clearCart(telegramId);

    await bot.sendMessage(
      chatId,
      `✅ ${t(lang, 'order_created')} #${order.id}`,
      { reply_markup: { remove_keyboard: false } }
    );
  } catch (err) {
    if (err.message === 'INSUFFICIENT_BALANCE') {
      await bot.sendMessage(chatId, t(lang, 'balance_insufficient'));
    } else {
      const body = err.response && err.response.body ? JSON.stringify(err.response.body) : (err.stack || err.message);
      console.error('[ERROR] confirmOrder:', body);
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

  await bot.sendMessage(chatId, `<b>${esc(t(lang, 'my_orders_title'))}</b>`, { parse_mode: 'HTML' });

  for (const order of orders) {
    const items = await notify.getOrderItems(order.id);
    const lines = [`<b>${esc(t(lang, 'order_label'))} #${order.id}</b>`];
    for (const it of items) {
      const nm = lang === 'uz' ? it.name_uz : it.name_ru;
      lines.push(`• ${esc(nm)} x${it.quantity}`);
    }
    lines.push(`💵 ${esc(formatMoney(order.total_amount))} ${esc(t(lang, 'currency'))}`);
    lines.push(`📦 ${esc(t(lang, 'status_label'))}: ${esc(t(lang, `status_${order.status}`))}`);
    await bot.sendMessage(chatId, lines.join('\n'), { parse_mode: 'HTML' });
  }
}

module.exports = {
  openDishCard,
  openDishFromDeepLink,
  startOrder,
  addToCart,
  handleQty,
  showCategory,
  checkout,
  handleCheckoutStep,
  skipComment,
  choosePayment,
  confirmOrder,
  cancelOrder,
  showMyOrders,
  renderCart,
};
