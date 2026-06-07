import { Language } from '@eatfit/shared';
import { useAuthStore } from '@/store/auth.store';

/** Лёгкий i18n фронта (RU/UZ). Язык — из профиля клиента (фолбэк ru). */
type Entry = { ru: string; uz: string };

const dict = {
  loading: { ru: 'Загрузка…', uz: 'Yuklanmoqda…' },
  open_in_telegram: { ru: 'Откройте приложение в Telegram', uz: 'Ilovani Telegram’da oching' },
  error_generic: { ru: 'Что-то пошло не так', uz: 'Nimadir xato ketdi' },
  retry: { ru: 'Повторить', uz: 'Qayta urinish' },

  // навигация
  nav_menu: { ru: 'Меню', uz: 'Menyu' },
  nav_cart: { ru: 'Корзина', uz: 'Savat' },
  nav_orders: { ru: 'Заказы', uz: 'Buyurtmalar' },
  nav_profile: { ru: 'Профиль', uz: 'Profil' },
  nav_admin: { ru: 'Админ', uz: 'Admin' },

  // меню/корзина
  menu_empty: { ru: 'Меню пока пустое', uz: 'Menyu hozircha bo‘sh' },
  cat_main: { ru: 'Основные блюда', uz: 'Asosiy taomlar' },
  cat_drink: { ru: 'Напитки', uz: 'Ichimliklar' },
  cat_dessert: { ru: 'Десерты', uz: 'Shirinliklar' },
  add: { ru: 'Добавить', uz: 'Qo‘shish' },
  cart_empty: { ru: 'Корзина пуста', uz: 'Savat bo‘sh' },
  total: { ru: 'Итого', uz: 'Jami' },
  checkout: { ru: 'Оформить заказ', uz: 'Buyurtma berish' },
  currency: { ru: 'сум', uz: 'so‘m' },

  // оформление
  comment: { ru: 'Комментарий', uz: 'Izoh' },
  comment_ph: { ru: 'Комментарий к заказу (необязательно)', uz: 'Buyurtmaga izoh (ixtiyoriy)' },
  pay_balance: { ru: 'С баланса', uz: 'Balansdan' },
  pay_cash: { ru: 'При получении', uz: 'Yetkazganda' },
  order_placed: { ru: 'Заказ оформлен!', uz: 'Buyurtma qabul qilindi!' },
  insufficient: { ru: 'Недостаточно средств на балансе', uz: 'Balansda mablag‘ yetarli emas' },

  // заказы/статусы
  no_orders: { ru: 'У вас пока нет заказов', uz: 'Sizda hozircha buyurtmalar yo‘q' },
  order: { ru: 'Заказ', uz: 'Buyurtma' },
  status: { ru: 'Статус', uz: 'Holat' },
  status_pending: { ru: 'Ожидает', uz: 'Kutilmoqda' },
  status_confirmed: { ru: 'Принят', uz: 'Qabul qilindi' },
  status_cooking: { ru: 'Готовится', uz: 'Tayyorlanmoqda' },
  status_ready: { ru: 'Готово', uz: 'Tayyor' },
  status_delivering: { ru: 'Доставляется', uz: 'Yetkazilmoqda' },
  status_done: { ru: 'Доставлен', uz: 'Yetkazildi' },
  status_cancelled: { ru: 'Отменён', uz: 'Bekor qilindi' },

  // профиль/регистрация
  profile: { ru: 'Профиль', uz: 'Profil' },
  name: { ru: 'Имя', uz: 'Ism' },
  phone: { ru: 'Телефон', uz: 'Telefon' },
  address: { ru: 'Адрес', uz: 'Manzil' },
  balance: { ru: 'Баланс', uz: 'Balans' },
  language: { ru: 'Язык', uz: 'Til' },
  save: { ru: 'Сохранить', uz: 'Saqlash' },
  saved: { ru: 'Сохранено', uz: 'Saqlandi' },
  register_title: { ru: 'Регистрация', uz: 'Ro‘yxatdan o‘tish' },
  register_hint: { ru: 'Заполните профиль, чтобы заказывать', uz: 'Buyurtma berish uchun profilni to‘ldiring' },
  required: { ru: 'Обязательное поле', uz: 'Majburiy maydon' },

  // ── вход/регистрация на сайте (вне Telegram) ──
  web_welcome: { ru: 'Eat&fit — доставка еды', uz: 'Eat&fit — taom yetkazib berish' },
  web_login: { ru: 'Вход', uz: 'Kirish' },
  web_register: { ru: 'Регистрация', uz: 'Ro‘yxatdan o‘tish' },
  web_password: { ru: 'Пароль', uz: 'Parol' },
  web_password_hint: { ru: 'Минимум 6 символов', uz: 'Kamida 6 ta belgi' },
  web_to_register: { ru: 'Нет аккаунта? Зарегистрироваться', uz: 'Hisob yo‘qmi? Ro‘yxatdan o‘tish' },
  web_to_login: { ru: 'Уже есть аккаунт? Войти', uz: 'Hisob bormi? Kirish' },
  web_auth_failed: { ru: 'Неверный телефон или пароль', uz: 'Telefon yoki parol noto‘g‘ri' },
  web_register_failed: { ru: 'Не удалось зарегистрироваться (телефон может быть занят)', uz: 'Ro‘yxatdan o‘tib bo‘lmadi (telefon band bo‘lishi mumkin)' },
  logout: { ru: 'Выйти', uz: 'Chiqish' },

  // ── админка ──
  adm_orders: { ru: 'Заказы', uz: 'Buyurtmalar' },
  adm_menu: { ru: 'Меню', uz: 'Menyu' },
  adm_users: { ru: 'Люди', uz: 'Odamlar' },
  adm_settings: { ru: 'Настройки', uz: 'Sozlamalar' },
  adm_search_user: { ru: 'Телефон / username / id', uz: 'Telefon / username / id' },
  adm_role: { ru: 'Роль', uz: 'Rol' },
  adm_deposit: { ru: 'Пополнить', uz: 'To‘ldirish' },
  adm_withdraw: { ru: 'Списать', uz: 'Yechish' },
  adm_amount: { ru: 'Сумма', uz: 'Summa' },
  adm_deposit_done: { ru: 'Баланс пополнен', uz: 'Balans to‘ldirildi' },
  adm_role_changed: { ru: 'Роль изменена', uz: 'Rol o‘zgartirildi' },
  adm_add_dish: { ru: '➕ Добавить блюдо', uz: '➕ Taom qo‘shish' },
  adm_edit: { ru: 'Изменить', uz: 'Tahrirlash' },
  adm_delete: { ru: 'Удалить', uz: 'O‘chirish' },
  adm_delete_q: { ru: 'Удалить блюдо?', uz: 'Taom o‘chirilsinmi?' },
  adm_hide: { ru: 'Скрыть', uz: 'Yashirish' },
  adm_show: { ru: 'Показать', uz: 'Ko‘rsatish' },
  adm_hidden: { ru: 'скрыто', uz: 'yashirilgan' },
  adm_name_ru: { ru: 'Название (RU)', uz: 'Nomi (RU)' },
  adm_name_uz: { ru: 'Название (UZ)', uz: 'Nomi (UZ)' },
  adm_desc_ru: { ru: 'Описание (RU)', uz: 'Tavsif (RU)' },
  adm_desc_uz: { ru: 'Описание (UZ)', uz: 'Tavsif (UZ)' },
  adm_category: { ru: 'Категория', uz: 'Kategoriya' },
  adm_price: { ru: 'Цена', uz: 'Narx' },
  adm_photo_url: { ru: 'URL фото (необязательно)', uz: 'Rasm URL (ixtiyoriy)' },
  adm_photo: { ru: 'Фото блюда', uz: 'Taom rasmi' },
  adm_photo_upload: { ru: '📷 Загрузить фото', uz: '📷 Rasm yuklash' },
  adm_photo_uploading: { ru: 'Загрузка фото…', uz: 'Rasm yuklanmoqda…' },
  adm_photo_remove: { ru: 'Удалить фото', uz: 'Rasmni o‘chirish' },
  adm_photo_save_first: { ru: 'Сначала сохраните блюдо, потом добавьте фото', uz: 'Avval taomni saqlang, keyin rasm qo‘shing' },
  act_confirm: { ru: 'Принять', uz: 'Qabul' },
  act_cook: { ru: 'Готовить', uz: 'Tayyorlash' },
  act_ready: { ru: 'Готово', uz: 'Tayyor' },
  act_deliver: { ru: 'На доставку', uz: 'Yetkazishga' },
  act_done: { ru: 'Доставлен', uz: 'Yetkazildi' },
  act_cancel: { ru: 'Отменить', uz: 'Bekor' },
  set_topup_tg: { ru: 'Telegram пополнения', uz: 'To‘ldirish Telegram' },
  set_topup_phone: { ru: 'Телефон пополнения', uz: 'To‘ldirish telefon' },
  set_support: { ru: 'Кнопка «Поддержка»', uz: '«Yordam» tugmasi' },
  role_client: { ru: 'клиент', uz: 'mijoz' },
  role_cook: { ru: 'повар', uz: 'oshpaz' },
  role_courier: { ru: 'курьер', uz: 'kuryer' },
  role_admin: { ru: 'админ', uz: 'admin' },
} satisfies Record<string, Entry>;

export type I18nKey = keyof typeof dict;

export function translate(lang: Language, key: I18nKey): string {
  const e = dict[key];
  return e ? (lang === Language.Uz ? e.uz : e.ru) : key;
}

/** Хук перевода: язык берётся из текущего клиента. */
export function useT(): (key: I18nKey) => string {
  const lang = useAuthStore((s) => s.client?.language ?? Language.Ru);
  return (key: I18nKey) => translate(lang, key);
}
