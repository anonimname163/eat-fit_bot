// Все тексты бота на двух языках (ru / uz).
// В handlers строки не хардкодим — берём только отсюда.

const dict = {
  // ---- Общие / меню ----
  choose_language: {
    ru: 'Выберите язык / Tilni tanlang:',
    uz: 'Выберите язык / Tilni tanlang:',
  },
  language_set: {
    ru: 'Язык установлен: Русский 🇷🇺',
    uz: 'Til tanlandi: O‘zbek 🇺🇿',
  },
  ask_first_name: {
    ru: 'Как вас зовут? Введите имя:',
    uz: 'Ismingiz nima? Ismingizni kiriting:',
  },
  ask_last_name: {
    ru: 'Введите вашу фамилию:',
    uz: 'Familiyangizni kiriting:',
  },
  ask_full_name: {
    ru: 'Введите имя и фамилию (например: Иван Иванов):',
    uz: 'Ism va familiyangizni kiriting (masalan: Ali Valiyev):',
  },
  ask_phone: {
    ru: 'Отправьте номер телефона кнопкой ниже или введите вручную:',
    uz: 'Telefon raqamingizni pastdagi tugma orqali yuboring yoki qo‘lda kiriting:',
  },
  share_contact: {
    ru: '📱 Поделиться контактом',
    uz: '📱 Kontaktni ulashish',
  },
  ask_address: {
    ru: 'Введите адрес доставки:',
    uz: 'Yetkazib berish manzilini kiriting:',
  },
  registration_done: {
    ru: 'Регистрация завершена! 🎉',
    uz: 'Ro‘yxatdan o‘tish yakunlandi! 🎉',
  },
  invalid_phone: {
    ru: 'Похоже, это не телефон. Попробуйте ещё раз:',
    uz: 'Bu telefon raqamiga o‘xshamaydi. Qayta urinib ko‘ring:',
  },

  // ---- Главное меню ----
  main_menu: {
    ru: 'Главное меню:',
    uz: 'Asosiy menyu:',
  },
  btn_make_order: {
    ru: '🍽 Сделать заказ',
    uz: '🍽 Buyurtma berish',
  },
  btn_profile: {
    ru: '👤 Мой профиль',
    uz: '👤 Profilim',
  },
  btn_balance: {
    ru: '💰 Мой баланс',
    uz: '💰 Balansim',
  },
  btn_my_orders: {
    ru: '📦 Мои заказы',
    uz: '📦 Buyurtmalarim',
  },
  btn_cook_mode: {
    ru: '👨‍🍳 Режим повара',
    uz: '👨‍🍳 Oshpaz rejimi',
  },
  btn_courier_mode: {
    ru: '🚗 Режим курьера',
    uz: '🚗 Kuryer rejimi',
  },
  btn_admin_panel: {
    ru: '🔧 Админ-панель',
    uz: '🔧 Admin panel',
  },

  // ---- Профиль / баланс ----
  profile_title: {
    ru: '👤 Ваш профиль',
    uz: '👤 Sizning profilingiz',
  },
  profile_name: { ru: 'Имя', uz: 'Ism' },
  profile_phone: { ru: 'Телефон', uz: 'Telefon' },
  profile_address: { ru: 'Адрес', uz: 'Manzil' },
  profile_balance: { ru: 'Баланс', uz: 'Balans' },
  balance_title: {
    ru: '💰 Ваш баланс',
    uz: '💰 Sizning balansingiz',
  },
  currency: { ru: 'сум', uz: 'so‘m' },

  // ---- Меню / категории ----
  menu_title: {
    ru: '🍽 Меню',
    uz: '🍽 Menyu',
  },
  menu_empty: {
    ru: 'Меню пока пустое.',
    uz: 'Menyu hozircha bo‘sh.',
  },
  cat_main: { ru: '🍲 Основные блюда', uz: '🍲 Asosiy taomlar' },
  cat_drink: { ru: '🥤 Напитки', uz: '🥤 Ichimliklar' },
  cat_dessert: { ru: '🍰 Десерты', uz: '🍰 Shirinliklar' },

  // ---- Корзина / заказ ----
  btn_add_to_cart: {
    ru: '➕ Добавить в корзину',
    uz: '➕ Savatga qo‘shish',
  },
  btn_decline: {
    ru: '❌ Не надо',
    uz: '❌ Kerak emas',
  },
  added_to_cart: {
    ru: 'Добавлено в корзину ✅',
    uz: 'Savatga qo‘shildi ✅',
  },
  add_something_else: {
    ru: 'Добавить что-то ещё?',
    uz: 'Yana biror narsa qo‘shasizmi?',
  },
  btn_drinks: { ru: 'Напитки 🥤', uz: 'Ichimliklar 🥤' },
  btn_desserts: { ru: 'Десерты 🍰', uz: 'Shirinliklar 🍰' },
  btn_checkout: {
    ru: '✅ Оформить заказ',
    uz: '✅ Buyurtmani rasmiylashtirish',
  },
  cart_title: {
    ru: '🛒 Ваша корзина',
    uz: '🛒 Sizning savatingiz',
  },
  cart_empty: {
    ru: 'Корзина пуста.',
    uz: 'Savat bo‘sh.',
  },
  cart_total: { ru: 'Итого', uz: 'Jami' },
  cart_address: { ru: 'Адрес доставки', uz: 'Yetkazib berish manzili' },
  pay_from_balance_q: {
    ru: 'На балансе достаточно средств. Списать с баланса?',
    uz: 'Balansda yetarli mablag‘ bor. Balansdan yechib olaylikmi?',
  },
  btn_pay_balance: {
    ru: '💰 Оплатить с баланса',
    uz: '💰 Balansdan to‘lash',
  },
  btn_pay_cash: {
    ru: '💵 Оплатить при получении',
    uz: '💵 Yetkazib berishda to‘lash',
  },
  btn_confirm_order: {
    ru: '✅ Подтвердить заказ',
    uz: '✅ Buyurtmani tasdiqlash',
  },
  btn_cancel: { ru: '❌ Отмена', uz: '❌ Bekor qilish' },
  order_created: {
    ru: 'Ваш заказ оформлен! Номер заказа',
    uz: 'Buyurtmangiz qabul qilindi! Buyurtma raqami',
  },
  order_cancelled_msg: {
    ru: 'Оформление отменено.',
    uz: 'Rasmiylashtirish bekor qilindi.',
  },
  ask_comment: {
    ru: 'Добавьте комментарий к заказу (или напишите «-» чтобы пропустить):',
    uz: 'Buyurtmaga izoh qoldiring (yoki o‘tkazib yuborish uchun «-» yozing):',
  },

  // ---- Мои заказы ----
  my_orders_title: {
    ru: '📦 Ваши заказы',
    uz: '📦 Sizning buyurtmalaringiz',
  },
  no_orders: {
    ru: 'У вас пока нет заказов.',
    uz: 'Sizda hozircha buyurtmalar yo‘q.',
  },
  order_label: { ru: 'Заказ', uz: 'Buyurtma' },
  status_label: { ru: 'Статус', uz: 'Holati' },

  // ---- Статусы (для клиента) ----
  status_pending: { ru: 'Ожидает подтверждения', uz: 'Tasdiqlash kutilmoqda' },
  status_confirmed: { ru: 'Принят', uz: 'Qabul qilindi' },
  status_cooking: { ru: 'Готовится', uz: 'Tayyorlanmoqda' },
  status_delivering: { ru: 'Доставляется', uz: 'Yetkazilmoqda' },
  status_done: { ru: 'Доставлен', uz: 'Yetkazib berildi' },
  status_cancelled: { ru: 'Отменён', uz: 'Bekor qilindi' },

  // ---- Уведомления клиенту о смене статуса ----
  notify_confirmed: {
    ru: 'Ваш заказ принят, готовим! 🍳',
    uz: 'Buyurtmangiz qabul qilindi, tayyorlayapmiz! 🍳',
  },
  notify_cooking: {
    ru: 'Повар приступил к готовке 👨‍🍳',
    uz: 'Oshpaz tayyorlashga kirishdi 👨‍🍳',
  },
  notify_delivering: {
    ru: 'Курьер выехал! 🚗',
    uz: 'Kuryer yo‘lga chiqdi! 🚗',
  },
  notify_done: {
    ru: 'Заказ доставлен. Приятного аппетита! 🙏',
    uz: 'Buyurtma yetkazib berildi. Yoqimli ishtaha! 🙏',
  },
  notify_cancelled: {
    ru: 'Заказ отменён',
    uz: 'Buyurtma bekor qilindi',
  },

  // ---- Повар ----
  cook_panel_title: {
    ru: '👨‍🍳 Режим повара — активные заказы:',
    uz: '👨‍🍳 Oshpaz rejimi — faol buyurtmalar:',
  },
  cook_no_orders: {
    ru: 'Активных заказов нет.',
    uz: 'Faol buyurtmalar yo‘q.',
  },
  btn_take_to_work: { ru: '✅ Принять в работу', uz: '✅ Ishga qabul qilish' },
  btn_ready: { ru: '🍽 Готово', uz: '🍽 Tayyor' },
  taken_to_work: { ru: 'Заказ принят в работу', uz: 'Buyurtma ishga qabul qilindi' },
  marked_ready: { ru: 'Заказ помечен как готовый', uz: 'Buyurtma tayyor deb belgilandi' },

  // ---- Курьер ----
  courier_panel_title: {
    ru: '🚗 Режим курьера — заказы к доставке:',
    uz: '🚗 Kuryer rejimi — yetkazib berish buyurtmalari:',
  },
  courier_no_orders: {
    ru: 'Заказов к доставке нет.',
    uz: 'Yetkazib berish buyurtmalari yo‘q.',
  },
  btn_take_delivery: { ru: '🚗 Взять доставку', uz: '🚗 Yetkazib berishni olish' },
  btn_delivered: { ru: '✅ Доставил', uz: '✅ Yetkazib berdim' },
  delivery_taken: { ru: 'Доставка закреплена за вами', uz: 'Yetkazib berish sizga biriktirildi' },
  delivery_done: { ru: 'Заказ доставлен', uz: 'Buyurtma yetkazib berildi' },

  // ---- Группы поваров / курьеров ----
  group_new_order: { ru: '🆕 Новый заказ', uz: '🆕 Yangi buyurtma' },
  group_comment: { ru: '📝 Комментарий', uz: '📝 Izoh' },
  group_ready_delivery: { ru: 'готов к доставке', uz: 'yetkazishga tayyor' },
  group_address: { ru: '📍 Адрес', uz: '📍 Manzil' },
  group_phone: { ru: '📞 Телефон', uz: '📞 Telefon' },

  // ---- Админ ----
  admin_panel_title: {
    ru: '⚙️ Панель администратора',
    uz: '⚙️ Administrator paneli',
  },
  admin_menu_mgmt: { ru: '📋 Управление меню', uz: '📋 Menyuni boshqarish' },
  admin_users: { ru: '👥 Пользователи', uz: '👥 Foydalanuvchilar' },
  admin_deposits: { ru: '💰 Депозиты', uz: '💰 Depozitlar' },
  admin_orders: { ru: '📊 Заказы', uz: '📊 Buyurtmalar' },
  admin_gen_post: { ru: '📢 Генерировать пост', uz: '📢 Post yaratish' },

  btn_add_dish: { ru: '➕ Добавить блюдо', uz: '➕ Taom qo‘shish' },
  btn_edit: { ru: '✏️ Редактировать', uz: '✏️ Tahrirlash' },
  btn_hide: { ru: '🙈 Скрыть', uz: '🙈 Yashirish' },
  btn_show: { ru: '👁 Показать', uz: '👁 Ko‘rsatish' },
  btn_delete: { ru: '🗑 Удалить', uz: '🗑 O‘chirish' },
  btn_back: { ru: '⬅️ Назад', uz: '⬅️ Orqaga' },

  dish_ask_name_ru: { ru: 'Название блюда (RU):', uz: 'Taom nomi (RU):' },
  dish_ask_name_uz: { ru: 'Название блюда (UZ):', uz: 'Taom nomi (UZ):' },
  dish_ask_desc_ru: { ru: 'Описание (RU):', uz: 'Tavsif (RU):' },
  dish_ask_desc_uz: { ru: 'Описание (UZ):', uz: 'Tavsif (UZ):' },
  dish_ask_category: { ru: 'Выберите категорию:', uz: 'Kategoriyani tanlang:' },
  dish_ask_price: { ru: 'Цена (только число, в сумах):', uz: 'Narxi (faqat raqam, so‘mda):' },
  dish_ask_photo: {
    ru: 'Отправьте фото блюда или напишите «-» чтобы пропустить:',
    uz: 'Taom rasmini yuboring yoki o‘tkazib yuborish uchun «-» yozing:',
  },
  dish_created: { ru: 'Блюдо создано ✅', uz: 'Taom yaratildi ✅' },
  dish_hidden: { ru: 'Блюдо скрыто', uz: 'Taom yashirildi' },
  dish_shown: { ru: 'Блюдо снова активно', uz: 'Taom yana faol' },
  dish_deleted: { ru: 'Блюдо удалено', uz: 'Taom o‘chirildi' },
  invalid_price: { ru: 'Введите корректное число:', uz: 'To‘g‘ri raqam kiriting:' },

  users_ask_query: {
    ru: 'Введите номер телефона или username для поиска:',
    uz: 'Qidirish uchun telefon raqami yoki username kiriting:',
  },
  user_not_found: { ru: 'Пользователь не найден.', uz: 'Foydalanuvchi topilmadi.' },
  btn_change_role: { ru: '🔁 Изменить роль', uz: '🔁 Rolni o‘zgartirish' },
  role_changed: { ru: 'Роль изменена на', uz: 'Rol o‘zgartirildi:' },

  deposit_ask_client: {
    ru: 'Введите telegram_id или телефон клиента:',
    uz: 'Mijozning telegram_id yoki telefonini kiriting:',
  },
  deposit_ask_amount: { ru: 'Введите сумму пополнения:', uz: 'To‘ldirish summasini kiriting:' },
  deposit_done: { ru: 'Баланс пополнен ✅', uz: 'Balans to‘ldirildi ✅' },
  deposit_history: { ru: 'История пополнений:', uz: 'To‘ldirishlar tarixi:' },

  gen_post_choose: {
    ru: 'Выберите блюдо для генерации поста:',
    uz: 'Post yaratish uchun taomni tanlang:',
  },
  gen_post_all: { ru: '📢 Все активные блюда', uz: '📢 Barcha faol taomlar' },
  post_order_btn: { ru: '👉 Заказать', uz: '👉 Buyurtma berish' },

  // ---- Ошибки / доступ ----
  error_generic: {
    ru: '⚠️ Произошла ошибка. Попробуйте позже.',
    uz: '⚠️ Xatolik yuz berdi. Keyinroq urinib ko‘ring.',
  },
  access_denied: {
    ru: '⛔ Недостаточно прав.',
    uz: '⛔ Ruxsat yetarli emas.',
  },
  not_registered: {
    ru: 'Пожалуйста, завершите регистрацию командой /start',
    uz: 'Iltimos, /start buyrug‘i bilan ro‘yxatdan o‘ting',
  },
  dish_not_found: {
    ru: 'Блюдо не найдено или недоступно.',
    uz: 'Taom topilmadi yoki mavjud emas.',
  },
  pcs: { ru: 'шт', uz: 'dona' },
};

/**
 * Получить строку по ключу на нужном языке.
 * @param {string} lang 'ru' | 'uz'
 * @param {string} key ключ из dict
 */
function t(lang, key) {
  const entry = dict[key];
  if (!entry) return key;
  return entry[lang] || entry.ru || key;
}

/** Названия категорий по ключу категории. */
function categoryName(lang, category) {
  const map = { main: 'cat_main', drink: 'cat_drink', dessert: 'cat_dessert' };
  return t(lang, map[category] || 'cat_main');
}

/** Локализованное имя блюда. */
function dishName(lang, item) {
  return (lang === 'uz' ? item.name_uz : item.name_ru) || item.name_ru || item.name_uz || '';
}

/** Локализованное описание блюда. */
function dishDesc(lang, item) {
  return (lang === 'uz' ? item.description_uz : item.description_ru) || item.description_ru || '';
}

/** Локализованный текст статуса заказа. */
function statusText(lang, status) {
  return t(lang, `status_${status}`);
}

/** Форматирование суммы: 25000 -> "25 000". */
function formatMoney(amount) {
  const n = Math.round(Number(amount) || 0);
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** Экранирование текста для parse_mode: 'HTML' (безопасно для названий/описаний). */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = { t, categoryName, dishName, dishDesc, statusText, formatMoney, esc };
