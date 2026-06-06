// Проверка подлинности Telegram Mini App initData (HMAC по BOT_TOKEN).
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
const crypto = require('crypto');
const { getClient, isRegistered } = require('../middleware/registration');

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
 * Express-middleware: требует валидный initData и завершённую регистрацию.
 * Кладёт строку клиента в req.client и tgUser в req.tgUser.
 * @param {string} botToken
 */
function requireAuth(botToken) {
  return async (req, res, next) => {
    try {
      const initData = req.get('X-Telegram-Init-Data') || '';
      const verified = verifyInitData(initData, botToken);
      if (!verified) {
        return res.status(401).json({ error: 'unauthorized' });
      }
      const client = await getClient(verified.user.id);
      if (!isRegistered(client)) {
        return res.status(403).json({ error: 'not_registered' });
      }
      req.tgUser = verified.user;
      req.client = client;
      next();
    } catch (err) {
      console.error('[ERROR] requireAuth:', err.message);
      res.status(500).json({ error: 'server_error' });
    }
  };
}

module.exports = { verifyInitData, requireAuth };
