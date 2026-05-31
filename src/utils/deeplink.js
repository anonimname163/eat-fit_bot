// Генерация deep link ссылок на блюда и постов для канала.
const { dishName, dishDesc, formatMoney, t } = require('../i18n');

/**
 * Deep link на конкретное блюдо:
 * https://t.me/<BOT_USERNAME>?start=item_<id>
 * @param {number} menuItemId
 */
function dishDeepLink(menuItemId) {
  const username = process.env.BOT_USERNAME || 'eatfit_bot';
  return `https://t.me/${username}?start=item_${menuItemId}`;
}

/**
 * Готовый текст поста для Telegram-канала по блюду.
 * @param {object} item строка из menu_items
 * @param {string} lang язык поста ('ru' | 'uz')
 */
function buildChannelPost(item, lang = 'ru') {
  const name = dishName(lang, item);
  const desc = dishDesc(lang, item);
  const price = formatMoney(item.price);
  const currency = t(lang, 'currency');

  // Ссылку выносим в inline-кнопку, в тексте её больше нет
  const lines = [];
  lines.push(`🍕 ${name}`);
  if (desc) lines.push(`📝 ${desc}`);
  lines.push(`💵 ${price} ${currency}`);
  return lines.join('\n');
}

module.exports = { dishDeepLink, buildChannelPost };
