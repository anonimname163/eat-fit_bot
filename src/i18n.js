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
  btn_support: {
    ru: '🆘 Поддержка',
    uz: '🆘 Yordam',
  },
  btn_webapp: {
    ru: '🌐 Открыть приложение',
    uz: '🌐 Ilovani ochish',
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

  // ---- Пополнение баланса (контакты) ----
  btn_topup: { ru: '💳 Пополнить баланс', uz: '💳 Balansni to‘ldirish' },
  topup_title: { ru: '💳 Пополнение баланса', uz: '💳 Balansni to‘ldirish' },
  topup_text: {
    ru: 'Чтобы пополнить баланс, напишите в Telegram или позвоните по номеру ниже:',
    uz: 'Balansni to‘ldirish uchun quyidagi Telegram’ga yozing yoki raqamga qo‘ng‘iroq qiling:',
  },
  topup_tg: { ru: 'Telegram', uz: 'Telegram' },
  topup_phone: { ru: 'Телефон', uz: 'Telefon' },
  topup_not_set: {
    ru: 'Контакты для пополнения пока не указаны. Обратитесь к администратору.',
    uz: 'To‘ldirish uchun kontaktlar hali ko‘rsatilmagan. Administratorga murojaat qiling.',
  },

  // ---- Контакты пополнения в админке ----
  admin_contacts: { ru: '📞 Контакты пополнения', uz: '📞 To‘ldirish kontaktlari' },
  contacts_title: { ru: 'Контакты для пополнения баланса', uz: 'Balansni to‘ldirish kontaktlari' },
  contact_edit_tg: { ru: '✏️ Telegram', uz: '✏️ Telegram' },
  contact_edit_phone: { ru: '✏️ Телефон', uz: '✏️ Telefon' },
  contact_ask_tg: {
    ru: 'Введите Telegram для пополнения (например @username или ссылку https://t.me/...):',
    uz: 'To‘ldirish uchun Telegram kiriting (masalan @username yoki https://t.me/... havola):',
  },
  contact_ask_phone: { ru: 'Введите номер телефона для пополнения:', uz: 'To‘ldirish uchun telefon raqamini kiriting:' },
  contact_saved: { ru: 'Контакт сохранён ✅', uz: 'Kontakt saqlandi ✅' },
  not_set_dash: { ru: 'не указан', uz: 'ko‘rsatilmagan' },

  // ---- Поддержка (для клиента) ----
  support_title: { ru: '🆘 Поддержка', uz: '🆘 Yordam' },
  support_text: {
    ru: 'Если у вас есть вопрос или проблема — свяжитесь с нами:',
    uz: 'Savol yoki muammo bo‘lsa — biz bilan bog‘laning:',
  },
  support_contact_btn: { ru: '✍️ Написать в поддержку', uz: '✍️ Yordamga yozish' },
  support_not_set: {
    ru: 'Контакты поддержки пока не указаны. Попробуйте позже.',
    uz: 'Yordam kontaktlari hali ko‘rsatilmagan. Keyinroq urinib ko‘ring.',
  },

  // ---- Поддержка в админке ----
  admin_support: { ru: '🆘 Поддержка', uz: '🆘 Yordam' },
  support_settings_title: { ru: 'Кнопка «Поддержка»', uz: '«Yordam» tugmasi' },
  support_current: { ru: 'Сейчас ведёт на', uz: 'Hozir yo‘naltiradi' },
  support_edit_btn: { ru: '✏️ Изменить', uz: '✏️ O‘zgartirish' },
  support_ask: {
    ru: 'Куда должна вести кнопка «Поддержка»? Введите @username, ссылку https://t.me/... или номер телефона:',
    uz: '«Yordam» tugmasi qayerga yo‘naltirsin? @username, https://t.me/... havola yoki telefon raqamini kiriting:',
  },
  support_saved: { ru: 'Поддержка сохранена ✅', uz: 'Yordam saqlandi ✅' },

  // ---- Редактирование профиля ----
  btn_edit_profile: { ru: '✏️ Редактировать профиль', uz: '✏️ Profilni tahrirlash' },
  profile_choose_field: { ru: 'Что изменить?', uz: 'Nimani o‘zgartiramiz?' },
  pf_name: { ru: '👤 Имя и фамилия', uz: '👤 Ism va familiya' },
  pf_phone: { ru: '📞 Телефон', uz: '📞 Telefon' },
  pf_address: { ru: '📍 Адрес', uz: '📍 Manzil' },
  pf_language: { ru: '🌐 Язык', uz: '🌐 Til' },
  profile_ask_name: { ru: 'Введите имя и фамилию:', uz: 'Ism va familiyani kiriting:' },
  profile_ask_phone: {
    ru: 'Отправьте номер телефона кнопкой ниже или введите вручную:',
    uz: 'Telefon raqamini pastdagi tugma orqali yuboring yoki qo‘lda kiriting:',
  },
  profile_ask_address: { ru: 'Введите новый адрес доставки:', uz: 'Yangi yetkazib berish manzilini kiriting:' },
  profile_saved: { ru: 'Профиль обновлён ✅', uz: 'Profil yangilandi ✅' },

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
  balance_insufficient: {
    ru: '❌ Недостаточно средств на балансе. Выберите оплату при получении.',
    uz: '❌ Balansda mablag‘ yetarli emas. Yetkazib berishda to‘lashni tanlang.',
  },
  ask_comment: {
    ru: 'Добавьте комментарий к заказу или нажмите кнопку ниже:',
    uz: 'Buyurtmaga izoh qoldiring yoki pastdagi tugmani bosing:',
  },
  btn_no_comment: { ru: '➡️ Без комментария', uz: '➡️ Izohsiz' },

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
  admin_report: { ru: '📈 Отправить итоги', uz: '📈 Yakunlarni yuborish' },
  report_sent: { ru: 'Итоги отправлены ✅', uz: 'Yakunlar yuborildi ✅' },
  btn_cancel_order: { ru: '🚫 Отменить', uz: '🚫 Bekor qilish' },
  order_cancelled_admin: { ru: 'Заказ отменён, средства возвращены', uz: 'Buyurtma bekor qilindi, mablag‘ qaytarildi' },
  order_already_closed: { ru: 'Заказ уже завершён или отменён', uz: 'Buyurtma allaqachon yakunlangan yoki bekor qilingan' },

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
  photo_save_failed: {
    ru: '⚠️ Фото не принято Telegram (неверный файл). Блюдо сохранено без фото. Попробуйте загрузить другое изображение через ✏️ Редактировать → 🖼 Фото.',
    uz: '⚠️ Rasm Telegram tomonidan qabul qilinmadi (noto‘g‘ri fayl). Taom rasmsiz saqlandi. ✏️ Tahrirlash → 🖼 Rasm orqali boshqa rasm yuklang.',
  },
  dish_hidden: { ru: 'Блюдо скрыто', uz: 'Taom yashirildi' },
  dish_shown: { ru: 'Блюдо снова активно', uz: 'Taom yana faol' },
  dish_deleted: { ru: 'Блюдо удалено', uz: 'Taom o‘chirildi' },
  invalid_price: { ru: 'Введите корректное число:', uz: 'To‘g‘ri raqam kiriting:' },

  // ---- Редактирование блюда ----
  edit_choose_field: { ru: 'Что отредактировать?', uz: 'Nimani tahrirlash?' },
  field_name_ru: { ru: '📝 Название (RU)', uz: '📝 Nomi (RU)' },
  field_name_uz: { ru: '📝 Название (UZ)', uz: '📝 Nomi (UZ)' },
  field_desc_ru: { ru: '📄 Описание (RU)', uz: '📄 Tavsif (RU)' },
  field_desc_uz: { ru: '📄 Описание (UZ)', uz: '📄 Tavsif (UZ)' },
  field_category: { ru: '🗂 Категория', uz: '🗂 Kategoriya' },
  field_price: { ru: '💵 Цена', uz: '💵 Narx' },
  field_photo: { ru: '🖼 Фото', uz: '🖼 Rasm' },
  edit_saved: { ru: 'Изменения сохранены ✅', uz: 'O‘zgarishlar saqlandi ✅' },

  users_ask_query: {
    ru: 'Введите номер телефона или username для поиска:',
    uz: 'Qidirish uchun telefon raqami yoki username kiriting:',
  },
  user_not_found: { ru: 'Пользователь не найден.', uz: 'Foydalanuvchi topilmadi.' },
  btn_change_role: { ru: '🔁 Изменить роль', uz: '🔁 Rolni o‘zgartirish' },
  role_changed: { ru: 'Роль изменена на', uz: 'Rol o‘zgartirildi:' },

  deposit_add: { ru: '➕ Пополнить баланс', uz: '➕ Balansni to‘ldirish' },
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
  post_for_channel: {
    ru: '📢 Превью поста. Нажмите «Опубликовать в канал» — пост уйдёт без отметки отправителя:',
    uz: '📢 Post ko‘rinishi. «Kanalga joylash» tugmasini bosing — post yuboruvchi belgisi’siz chiqadi:',
  },
  btn_publish_channel: { ru: '📤 Опубликовать в канал', uz: '📤 Kanalga joylash' },
  published_ok: { ru: 'Опубликовано в канал ✅', uz: 'Kanalga joylandi ✅' },
  channel_not_set: {
    ru: '⚠️ CHANNEL_ID не задан. Укажите ID канала в настройках и добавьте бота админом канала.',
    uz: '⚠️ CHANNEL_ID ko‘rsatilmagan. Kanal ID’sini sozlamalarga qo‘shing va botni kanalga admin qiling.',
  },

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
