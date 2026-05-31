// In-memory состояние: корзины и пошаговые диалоги (по telegram_id).
// Корзина хранится в памяти, пока заказ не оформлен (требование ТЗ).

/**
 * carts: Map<telegramId, { items: Map<menuItemId, { item, quantity }>, comment, payFromBalance }>
 */
const carts = new Map();

/**
 * sessions: Map<telegramId, { flow: string, step: string, data: object }>
 * Используется для регистрации, добавления блюда, депозитов и т.п.
 */
const sessions = new Map();

/**
 * Защита от дублей callback_query: храним недавно обработанные id.
 */
const processedCallbacks = new Map(); // id -> timestamp

// ---------- Корзина ----------

function getCart(telegramId) {
  if (!carts.has(telegramId)) {
    carts.set(telegramId, { items: new Map(), comment: null, payFromBalance: false });
  }
  return carts.get(telegramId);
}

function addToCart(telegramId, item) {
  const cart = getCart(telegramId);
  const existing = cart.items.get(item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.items.set(item.id, { item, quantity: 1 });
  }
  return cart;
}

function cartTotal(cart) {
  let total = 0;
  for (const { item, quantity } of cart.items.values()) {
    total += Number(item.price) * quantity;
  }
  return total;
}

function cartIsEmpty(cart) {
  return !cart || cart.items.size === 0;
}

function clearCart(telegramId) {
  carts.delete(telegramId);
}

// ---------- Сессии (диалоги) ----------

function getSession(telegramId) {
  return sessions.get(telegramId) || null;
}

function setSession(telegramId, flow, step, data = {}) {
  sessions.set(telegramId, { flow, step, data });
}

function updateSession(telegramId, patch) {
  const s = sessions.get(telegramId);
  if (s) sessions.set(telegramId, { ...s, ...patch });
}

function clearSession(telegramId) {
  sessions.delete(telegramId);
}

// ---------- Антидубль callback ----------

/**
 * Вернуть true, если callback уже обрабатывался (дубль).
 * Иначе пометить обработанным.
 */
function isDuplicateCallback(callbackId) {
  const now = Date.now();
  // Чистим старые записи (> 60 c)
  for (const [id, ts] of processedCallbacks) {
    if (now - ts > 60000) processedCallbacks.delete(id);
  }
  if (processedCallbacks.has(callbackId)) return true;
  processedCallbacks.set(callbackId, now);
  return false;
}

module.exports = {
  getCart,
  addToCart,
  cartTotal,
  cartIsEmpty,
  clearCart,
  getSession,
  setSession,
  updateSession,
  clearSession,
  isDuplicateCallback,
};
