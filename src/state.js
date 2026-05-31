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

/**
 * Нормализация ключа. PostgreSQL возвращает BIGINT (telegram_id) как строку,
 * а Telegram (msg.from.id) — как число. Приводим всё к строке, чтобы
 * один и тот же пользователь всегда указывал на одну запись в Map.
 */
function key(telegramId) {
  return String(telegramId);
}

// ---------- Корзина ----------

function getCart(telegramId) {
  const k = key(telegramId);
  if (!carts.has(k)) {
    carts.set(k, { items: new Map(), comment: null, payFromBalance: false });
  }
  return carts.get(k);
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
  carts.delete(key(telegramId));
}

// ---------- Сессии (диалоги) ----------

function getSession(telegramId) {
  return sessions.get(key(telegramId)) || null;
}

function setSession(telegramId, flow, step, data = {}) {
  sessions.set(key(telegramId), { flow, step, data });
}

function updateSession(telegramId, patch) {
  const k = key(telegramId);
  const s = sessions.get(k);
  if (s) sessions.set(k, { ...s, ...patch });
}

function clearSession(telegramId) {
  sessions.delete(key(telegramId));
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
