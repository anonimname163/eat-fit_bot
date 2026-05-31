// Просмотр меню ресторана по категориям.
const db = require('../db');
const { t, categoryName, dishName, dishDesc, formatMoney, esc } = require('../i18n');
const { dishDeepLink } = require('../utils/deeplink');

/** Активные блюда категории. */
async function activeItemsByCategory(category) {
  const { rows } = await db.query(
    `SELECT * FROM menu_items WHERE is_active = TRUE AND category = $1 ORDER BY id`,
    [category]
  );
  return rows;
}

/** Все активные блюда. */
async function allActiveItems() {
  const { rows } = await db.query(
    `SELECT * FROM menu_items WHERE is_active = TRUE ORDER BY category, id`
  );
  return rows;
}

/** Получить блюдо по id (активное). */
async function getActiveItem(id) {
  const { rows } = await db.query(
    `SELECT * FROM menu_items WHERE id = $1 AND is_active = TRUE`,
    [id]
  );
  return rows.length ? rows[0] : null;
}

/**
 * Показать меню по категориям с кнопками «добавить» под каждым блюдом.
 */
async function showMenu(bot, chatId, client) {
  const lang = client.language || 'ru';
  const items = await allActiveItems();

  if (!items.length) {
    await bot.sendMessage(chatId, t(lang, 'menu_empty'));
    return;
  }

  await bot.sendMessage(chatId, t(lang, 'menu_title'));

  const categories = ['main', 'drink', 'dessert'];
  for (const cat of categories) {
    const catItems = items.filter((i) => i.category === cat);
    if (!catItems.length) continue;

    await bot.sendMessage(chatId, `<b>${esc(categoryName(lang, cat))}</b>`, { parse_mode: 'HTML' });

    for (const item of catItems) {
      const name = dishName(lang, item);
      const desc = dishDesc(lang, item);
      const price = `${formatMoney(item.price)} ${t(lang, 'currency')}`;
      let text = `🍽 <b>${esc(name)}</b>\n`;
      if (desc) text += `${esc(desc)}\n`;
      text += `💵 ${esc(price)}`;

      const opts = {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: t(lang, 'btn_add_to_cart'), callback_data: `cart:add:${item.id}` },
          ]],
        },
      };

      if (item.photo_url) {
        try {
          await bot.sendPhoto(chatId, item.photo_url, { caption: text, ...opts });
          continue;
        } catch (err) {
          const body = err.response && err.response.body ? JSON.stringify(err.response.body) : err.message;
          console.error('[ERROR] sendPhoto в меню (item', item.id, '):', body);
        }
      }
      await bot.sendMessage(chatId, text, opts);
    }
  }
}

module.exports = {
  activeItemsByCategory,
  allActiveItems,
  getActiveItem,
  showMenu,
  dishDeepLink,
};
