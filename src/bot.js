// Точка входа: инициализация бота, регистрация команд, маршрутизация.
require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const db = require('./db');
const { t } = require('./i18n');
const state = require('./state');
const { getClient, isRegistered } = require('./middleware/registration');
const { effectiveRole, hasRole, isEnvAdmin } = require('./middleware/auth');

const start = require('./handlers/start');
const menu = require('./handlers/menu');
const order = require('./handlers/order');
const profile = require('./handlers/profile');
const cook = require('./handlers/cook');
const courier = require('./handlers/courier');
const admin = require('./handlers/admin');
const report = require('./report');
const { startWebServer } = require('./web/server');

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error('[ERROR] BOT_TOKEN не задан в .env');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// ---------- Команды бота ----------
async function setupCommands() {
  try {
    await bot.setMyCommands([
      { command: 'start', description: 'Главное меню / Asosiy menyu' },
      { command: 'menu', description: 'Меню ресторана / Menyu' },
      { command: 'orders', description: 'Мои заказы / Buyurtmalarim' },
      { command: 'profile', description: 'Мой профиль / Profilim' },
      { command: 'admin', description: 'Админ-панель (только для админов)' },
    ]);
    console.log('[INFO] Команды бота установлены');
  } catch (err) {
    console.error('[ERROR] setMyCommands:', err.message);
  }
}

// Кнопка-меню Mini App (рядом с полем ввода), если задан публичный URL приложения.
async function setupMenuButton() {
  const url = process.env.WEB_APP_URL;
  if (!url) {
    console.log('[INFO] WEB_APP_URL не задан — кнопка Mini App не установлена');
    return;
  }
  try {
    await bot.setChatMenuButton({
      menu_button: { type: 'web_app', text: 'Eat&fit', web_app: { url } },
    });
    console.log('[INFO] Кнопка-меню Mini App установлена');
  } catch (err) {
    console.error('[ERROR] setChatMenuButton:', err.message);
  }
}

// ---------- Утилиты ----------

/** Гарантировать регистрацию; вернуть client или null (с сообщением). */
async function requireRegistered(chatId, telegramId) {
  const client = await getClient(telegramId);
  if (!isRegistered(client)) {
    const lang = (client && client.language) || 'ru';
    await bot.sendMessage(chatId, t(lang, 'not_registered'));
    return null;
  }
  return client;
}

// ============================================================
//  ОБРАБОТКА СООБЩЕНИЙ
// ============================================================
bot.on('message', async (msg) => {
  try {
    // /start обрабатываем отдельно (включая deep link payload)
    if (msg.text && msg.text.startsWith('/start')) {
      await start.handleStart(bot, msg, order);
      return;
    }

    const telegramId = msg.from.id;
    const chatId = msg.chat.id;

    // Игнорируем сообщения из групп (поваров/курьеров), кроме команд — там работают только кнопки
    if (msg.chat.type !== 'private') return;

    // 1) Активный пошаговый диалог имеет приоритет
    if (await start.handleRegistrationStep(bot, msg, order)) return;
    if (await order.handleCheckoutStep(bot, msg)) return;
    if (await admin.handleAddDishStep(bot, msg)) return;
    if (await admin.handleEditDishStep(bot, msg)) return;
    if (await admin.handleUserSearchStep(bot, msg)) return;
    if (await admin.handleDepositStep(bot, msg)) return;
    if (await admin.handleContactStep(bot, msg)) return;
    if (await profile.handleProfileEditStep(bot, msg)) return;

    // 2) Команды
    if (msg.text === '/menu') {
      const client = await requireRegistered(chatId, telegramId);
      if (client) await menu.showMenu(bot, chatId, client);
      return;
    }
    if (msg.text === '/orders') {
      const client = await requireRegistered(chatId, telegramId);
      if (client) await order.showMyOrders(bot, chatId, client);
      return;
    }
    if (msg.text === '/profile') {
      const client = await requireRegistered(chatId, telegramId);
      if (client) await profile.showProfile(bot, chatId, client);
      return;
    }
    if (msg.text === '/admin') {
      const client = await getClient(telegramId);
      if (isEnvAdmin(telegramId)) {
        await admin.showAdminPanel(bot, chatId, client);
      } else {
        const lang = (client && client.language) || 'ru';
        await bot.sendMessage(chatId, t(lang, 'access_denied'));
      }
      return;
    }

    // 3) Reply-кнопки главного меню (сопоставление по тексту обоих языков)
    const client = await requireRegistered(chatId, telegramId);
    if (!client) return;
    const lang = client.language || 'ru';
    const text = msg.text || '';

    if (text === t('ru', 'btn_make_order') || text === t('uz', 'btn_make_order')) {
      await order.startOrder(bot, chatId, client);
    } else if (text === t('ru', 'btn_profile') || text === t('uz', 'btn_profile')) {
      await profile.showProfile(bot, chatId, client);
    } else if (text === t('ru', 'btn_balance') || text === t('uz', 'btn_balance')) {
      await profile.showBalance(bot, chatId, client);
    } else if (text === t('ru', 'btn_my_orders') || text === t('uz', 'btn_my_orders')) {
      await order.showMyOrders(bot, chatId, client);
    } else if (text === t('ru', 'btn_support') || text === t('uz', 'btn_support')) {
      await profile.showSupport(bot, chatId, client);
    } else if (text === t('ru', 'btn_cook_mode') || text === t('uz', 'btn_cook_mode')) {
      if (hasRole(client, telegramId, ['cook', 'admin'])) await cook.showCookPanel(bot, chatId, client);
      else await bot.sendMessage(chatId, t(lang, 'access_denied'));
    } else if (text === t('ru', 'btn_courier_mode') || text === t('uz', 'btn_courier_mode')) {
      if (hasRole(client, telegramId, ['courier', 'admin'])) await courier.showCourierPanel(bot, chatId, client);
      else await bot.sendMessage(chatId, t(lang, 'access_denied'));
    } else if (text === t('ru', 'btn_admin_panel') || text === t('uz', 'btn_admin_panel')) {
      if (isEnvAdmin(telegramId)) await admin.showAdminPanel(bot, chatId, client);
      else await bot.sendMessage(chatId, t(lang, 'access_denied'));
    }
    // прочий текст вне диалога — игнорируем
  } catch (err) {
    console.error('[ERROR] message handler:', err);
    try {
      const client = await getClient(msg.from.id);
      const lang = (client && client.language) || 'ru';
      await bot.sendMessage(msg.chat.id, t(lang, 'error_generic'));
    } catch (_) { /* игнор */ }
  }
});

// ============================================================
//  ОБРАБОТКА CALLBACK QUERY (inline-кнопки)
// ============================================================
bot.on('callback_query', async (query) => {
  try {
    // Защита от дублей
    if (state.isDuplicateCallback(query.id)) return;

    const data = query.data || '';
    const telegramId = query.from.id;
    const [domain] = data.split(':');

    // --- Выбор языка (доступно без полной регистрации) ---
    if (domain === 'lang') {
      await start.handleLanguageChoice(bot, query);
      return;
    }

    const actor = await getClient(telegramId);
    const lang = (actor && actor.language) || 'ru';

    // --- Степпер количества под блюдом ---
    if (domain === 'qty') {
      const client = await getClient(telegramId);
      if (!isRegistered(client)) {
        await bot.answerCallbackQuery(query.id, { text: t(lang, 'not_registered') });
        return;
      }
      await order.handleQty(bot, query, client);
      return;
    }

    // --- Клиентские: корзина / заказ ---
    if (domain === 'cart') {
      const client = await getClient(telegramId);
      if (!isRegistered(client)) {
        await bot.answerCallbackQuery(query.id, { text: t(lang, 'not_registered') });
        return;
      }
      const sub = data.split(':')[1];
      if (sub === 'add') await order.addToCart(bot, query, client);
      else if (sub === 'decline') await order.cancelOrder(bot, query, client);
      else if (sub === 'cat') await order.showCategory(bot, query, client);
      else if (sub === 'checkout') await order.checkout(bot, query, client);
      return;
    }

    if (domain === 'order') {
      const client = await getClient(telegramId);
      if (!isRegistered(client)) {
        await bot.answerCallbackQuery(query.id, { text: t(lang, 'not_registered') });
        return;
      }
      const sub = data.split(':')[1];
      if (sub === 'pay') await order.choosePayment(bot, query, client);
      else if (sub === 'confirm') await order.confirmOrder(bot, query, client);
      else if (sub === 'cancel') await order.cancelOrder(bot, query, client);
      else if (sub === 'nocomment') await order.skipComment(bot, query, client);
      return;
    }

    // --- Профиль (редактирование) ---
    if (domain === 'profile') {
      const client = await getClient(telegramId);
      if (!isRegistered(client)) {
        await bot.answerCallbackQuery(query.id, { text: t(lang, 'not_registered') });
        return;
      }
      const sub = data.split(':')[1];
      if (sub === 'edit') await profile.showEditProfile(bot, query, client);
      else if (sub === 'field') await profile.startProfileField(bot, query, client);
      return;
    }

    // --- Баланс: пополнение (показ контактов) ---
    if (domain === 'balance') {
      const client = await getClient(telegramId);
      if (!isRegistered(client)) {
        await bot.answerCallbackQuery(query.id, { text: t(lang, 'not_registered') });
        return;
      }
      if (data.split(':')[1] === 'topup') await profile.showTopup(bot, query, client);
      return;
    }

    // --- Повар ---
    if (domain === 'cook') {
      if (!hasRole(actor, telegramId, ['cook', 'admin'])) {
        await bot.answerCallbackQuery(query.id, { text: t(lang, 'access_denied') });
        return;
      }
      const sub = data.split(':')[1];
      if (sub === 'take') await cook.takeToWork(bot, query, actor);
      else if (sub === 'ready') await cook.markReady(bot, query, actor);
      return;
    }

    // --- Курьер ---
    if (domain === 'courier') {
      if (!hasRole(actor, telegramId, ['courier', 'admin'])) {
        await bot.answerCallbackQuery(query.id, { text: t(lang, 'access_denied') });
        return;
      }
      const sub = data.split(':')[1];
      if (sub === 'take') await courier.takeDelivery(bot, query, actor);
      else if (sub === 'done') await courier.markDelivered(bot, query, actor);
      return;
    }

    // --- Админ ---
    if (domain === 'admin') {
      if (!isEnvAdmin(telegramId)) {
        await bot.answerCallbackQuery(query.id, { text: t(lang, 'access_denied') });
        return;
      }
      const chatId = query.message.chat.id;
      const parts = data.split(':'); // admin:<section>:...

      switch (parts[1]) {
        case 'menu':
          await bot.answerCallbackQuery(query.id);
          await admin.showMenuManagement(bot, chatId, lang);
          break;
        case 'users':
          await bot.answerCallbackQuery(query.id);
          await admin.startUserSearch(bot, chatId, telegramId, lang);
          break;
        case 'deposits':
          await bot.answerCallbackQuery(query.id);
          await bot.sendMessage(chatId, t(lang, 'admin_deposits'), {
            reply_markup: {
              inline_keyboard: [
                [{ text: t(lang, 'deposit_add'), callback_data: 'admin:depadd' }],
                [{ text: t(lang, 'deposit_history'), callback_data: 'admin:dephist' }],
              ],
            },
          });
          break;
        case 'depadd':
          await bot.answerCallbackQuery(query.id);
          await admin.startDeposit(bot, chatId, telegramId, lang);
          break;
        case 'dephist':
          await bot.answerCallbackQuery(query.id);
          await admin.showDepositHistory(bot, chatId, lang);
          break;
        case 'orders':
          await bot.answerCallbackQuery(query.id);
          await admin.showOrdersOverview(bot, chatId, lang);
          break;
        case 'genpost':
          await bot.answerCallbackQuery(query.id);
          await admin.showGenPostMenu(bot, chatId, lang);
          break;
        case 'report': {
          // Отправляем итоги в админ-группу (если задана), иначе в этот чат
          const target = process.env.ADMIN_GROUP_ID || chatId;
          await report.sendDailyReport(bot, target);
          await bot.answerCallbackQuery(query.id, { text: t(lang, 'report_sent') });
          break;
        }
        case 'cancelorder':
          await admin.cancelOrderByAdmin(bot, query, lang);
          break;
        case 'post':
          await admin.generatePost(bot, query, lang);
          break;
        case 'publish':
          await admin.publishPost(bot, query, lang);
          break;
        case 'contacts':
          await bot.answerCallbackQuery(query.id);
          await admin.showContacts(bot, chatId, lang);
          break;
        case 'support':
          await bot.answerCallbackQuery(query.id);
          await admin.showSupportSetting(bot, chatId, lang);
          break;
        case 'contact':
          await admin.startEditContact(bot, query, lang);
          break;
        case 'dish':
          if (parts[2] === 'add') {
            await bot.answerCallbackQuery(query.id);
            await admin.startAddDish(bot, chatId, telegramId, lang);
          } else if (parts[2] === 'edit') {
            await admin.showEditFields(bot, query, lang);
          } else {
            await admin.dishToggle(bot, query, lang);
          }
          break;
        case 'dishcat':
          await admin.handleDishCategory(bot, query);
          break;
        case 'editf':
          await admin.startEditField(bot, query, lang);
          break;
        case 'editcat':
          await admin.handleEditCategory(bot, query, lang);
          break;
        case 'role':
          await admin.showRolePicker(bot, query, lang);
          break;
        case 'setrole':
          await admin.setUserRole(bot, query, lang);
          break;
        default:
          await bot.answerCallbackQuery(query.id);
      }
      return;
    }

    // неизвестный callback
    await bot.answerCallbackQuery(query.id);
  } catch (err) {
    console.error('[ERROR] callback handler:', err);
    try {
      await bot.answerCallbackQuery(query.id, { text: t('ru', 'error_generic') });
    } catch (_) { /* игнор */ }
  }
});

// ---------- Глобальные обработчики ошибок polling ----------
bot.on('polling_error', (err) => {
  console.error('[ERROR] polling:', err.code, err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[ERROR] unhandledRejection:', reason);
});

// ---------- Запуск ----------
(async () => {
  try {
    await db.migrate();
  } catch (err) {
    console.error('[ERROR] Не удалось применить схему БД:', err.message);
    process.exit(1);
  }
  await setupCommands();
  await setupMenuButton();
  report.startDailyReportScheduler(bot);
  startWebServer(bot);
  console.log('[INFO] Eat&fit bot запущен (polling)');
})();

module.exports = { bot };
