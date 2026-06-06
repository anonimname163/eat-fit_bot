// Проверка подлинности Telegram Mini App initData (HMAC по BOT_TOKEN).
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
const crypto = require('crypto');
const db = require('../db');
const { getClient, isRegistered } = require('../middleware/registration');
const { isEnvAdmin, syncAdminRole } = require('../middleware/auth');

// Максимальный возраст initData (защита от повторного использования), сек.
const MAX_AGE_SECONDS = 24 * 60 * 60;

/**
 * Проверить initData и вернуть распарсенного пользователя Telegram.
 * @param {string} initData строка window.Telegram.WebApp.initData
 * @param {string} botToken
 * @returns {{ user: object, authDate: number } | null}
 */
function verifyInitData(initData, botToken) {
  if (!initData || !botToken) return null;

  let params;
  try {
    params = new URLSearchParams(initData);
  } catch (_) {
    return null;
  }

  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  // data_check_string: пары key=value, отсортированные по ключу, через \n
  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calcHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  // Сравнение в постоянное время
  const a = Buffer.from(calcHash, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const authDate = Number(params.get('auth_date')) || 0;
  if (authDate && (Date.now() / 1000 - authDate) > MAX_AGE_SECONDS) return null;

  const userStr = params.get('user');
  if (!userStr) return null;
  try {
    return { user: JSON.parse(userStr), authDate };
  } catch (_) {
    return null;
  }
}

/**
 * Базовая проверка: валидный initData. Гарантирует наличие строки клиента
 * (создаёт «заготовку» для тех, кто пришёл сразу в Mini App, минуя /start).
 * НЕ требует завершённой регистрации — используется для профиля/регистрации.
 * Кладёт req.tgUser и req.client.
 * @param {string} botToken
 */
function requireTelegram(botToken) {
  return async (req, res, next) => {
    try {
      const initData = req.get('X-Telegram-Init-Data') || '';
      const verified = verifyInitData(initData, botToken);
      if (!verified) return res.status(401).json({ error: 'unauthorized' });

      const tgId = verified.user.id;
      let client = await getClient(tgId);
      if (!client) {
        await db.query(
          `INSERT INTO clients (telegram_id, first_name, role)
           VALUES ($1, $2, 'client')
           ON CONFLICT (telegram_id) DO NOTHING`,
          [tgId, verified.user.first_name || null]
        );
        client = await getClient(tgId);
      }
      // Синхронизировать роль admin из .env (как делает /start)
      if (isEnvAdmin(tgId) && client && client.role !== 'admin') {
        await syncAdminRole(tgId);
        client = await getClient(tgId);
      }

      req.tgUser = verified.user;
      req.client = client;
      next();
    } catch (err) {
      console.error('[ERROR] requireTelegram:', err.message);
      res.status(500).json({ error: 'server_error' });
    }
  };
}

/**
 * Требует валидный initData И завершённую регистрацию (имя/телефон/адрес).
 * @param {string} botToken
 */
function requireAuth(botToken) {
  const base = requireTelegram(botToken);
  return (req, res, next) => base(req, res, () => {
    if (!isRegistered(req.client)) return res.status(403).json({ error: 'not_registered' });
    next();
  });
}

/**
 * Требует валидный initData И права администратора (ADMIN_TELEGRAM_IDS).
 * @param {string} botToken
 */
function requireAdmin(botToken) {
  const base = requireTelegram(botToken);
  return (req, res, next) => base(req, res, () => {
    if (!isEnvAdmin(req.tgUser.id)) return res.status(403).json({ error: 'forbidden' });
    next();
  });
}

module.exports = { verifyInitData, requireTelegram, requireAuth, requireAdmin };
