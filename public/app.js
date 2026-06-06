/* Eat&fit Mini App — витрина, корзина, заказы, профиль. Vanilla JS. */
(function () {
  'use strict';

  // ---------------- Telegram WebApp ----------------
  var tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  var initData = tg && tg.initData ? tg.initData : '';
  var inTelegram = !!initData; // есть подпись -> запущено внутри Telegram

  if (tg) {
    try { tg.ready(); tg.expand(); } catch (e) {}
  }

  // ---------------- i18n ----------------
  var I18N = {
    ru: {
      tab_menu: 'Меню', tab_cart: 'Корзина', tab_orders: 'Заказы', tab_profile: 'Профиль',
      cat_main: '🍲 Основные блюда', cat_drink: '🥤 Напитки', cat_dessert: '🍰 Десерты',
      currency: 'сум', add: 'В корзину', menu_empty: 'Меню пока пустое',
      cart_empty: 'Корзина пуста', cart_total: 'Итого', comment: 'Комментарий к заказу',
      comment_ph: 'Например: без лука, позвонить за 10 минут…',
      pay_method: 'Способ оплаты', pay_balance: 'Оплатить с баланса', pay_cash: 'Оплатить при получении',
      checkout: 'Оформить заказ', address: 'Адрес доставки',
      orders_empty: 'У вас пока нет заказов', order: 'Заказ', no_orders_hint: 'Оформите первый заказ в разделе «Меню»',
      balance: 'Баланс', profile: 'Профиль', name: 'Имя и фамилия', phone: 'Телефон',
      save: 'Сохранить', topup: 'Пополнить баланс', support: 'Поддержка', edit: 'Редактировать профиль',
      lang: 'Язык', open_in_tg: 'Открыть в Telegram',
      browser_note: 'Это витрина. Чтобы оформить заказ, откройте приложение в Telegram.',
      order_ok: 'Заказ оформлен! №', saved: 'Сохранено ✅', err: 'Ошибка, попробуйте позже',
      err_balance: 'Недостаточно средств на балансе', err_empty: 'Корзина пуста',
      need_address: 'Сначала укажите адрес доставки в профиле',
      st_pending: 'Ожидает', st_confirmed: 'Принят', st_cooking: 'Готовится',
      st_delivering: 'Доставляется', st_done: 'Доставлен', st_cancelled: 'Отменён',
      pcs: 'шт', placing: 'Оформляем…',
      // регистрация
      reg_title: 'Регистрация', reg_intro: 'Заполните данные, чтобы оформлять заказы',
      reg_save: 'Зарегистрироваться', reg_done: 'Добро пожаловать! 🎉', last_name: 'Фамилия',
      // админка
      tab_admin: 'Админ', adm_orders: 'Заказы', adm_menu: 'Меню', adm_users: 'Пользователи',
      adm_deposits: 'Депозиты', adm_settings: 'Настройки', adm_no_orders: 'Активных заказов нет',
      act_confirm: 'Принять', act_cooking: 'Готовится', act_delivering: 'Курьеру', act_done: 'Доставлен',
      act_cancel: 'Отменить', adm_add_dish: '➕ Добавить блюдо', adm_active: 'Активно', adm_hidden: 'Скрыто',
      adm_hide: 'Скрыть', adm_show: 'Показать', adm_edit: 'Изменить', adm_delete: 'Удалить',
      adm_save: 'Сохранить', adm_price: 'Цена', adm_category: 'Категория', adm_photo: 'Фото (URL или file_id)',
      adm_photo_upload: '📷 Загрузить фото', uploading: 'Загрузка фото…',
      adm_name_ru: 'Название (RU)', adm_name_uz: 'Название (UZ)', adm_desc_ru: 'Описание (RU)', adm_desc_uz: 'Описание (UZ)',
      adm_search_user: 'Телефон, @ник или ID', adm_search: 'Найти', adm_role: 'Роль', adm_topup: 'Пополнить',
      adm_amount: 'Сумма', adm_topup_done: 'Баланс пополнен ✅', adm_support: 'Кнопка «Поддержка»',
      adm_topup_tg: 'Telegram для пополнения', adm_topup_phone: 'Телефон для пополнения',
      adm_saved: 'Сохранено ✅', confirm_delete: 'Удалить блюдо?', adm_new_dish: 'Новое блюдо', adm_create: 'Создать',
      adm_user_nf: 'Пользователь не найден', adm_orders_active: 'Активные', adm_orders_all: 'Все', adm_found: 'Всего',
    },
    uz: {
      tab_menu: 'Menyu', tab_cart: 'Savat', tab_orders: 'Buyurtmalar', tab_profile: 'Profil',
      cat_main: '🍲 Asosiy taomlar', cat_drink: '🥤 Ichimliklar', cat_dessert: '🍰 Shirinliklar',
      currency: 'so‘m', add: 'Savatga', menu_empty: 'Menyu hozircha bo‘sh',
      cart_empty: 'Savat bo‘sh', cart_total: 'Jami', comment: 'Buyurtmaga izoh',
      comment_ph: 'Masalan: piyozsiz, 10 daqiqa oldin qo‘ng‘iroq qiling…',
      pay_method: 'To‘lov usuli', pay_balance: 'Balansdan to‘lash', pay_cash: 'Yetkazib berishda to‘lash',
      checkout: 'Buyurtma berish', address: 'Yetkazib berish manzili',
      orders_empty: 'Sizda hali buyurtmalar yo‘q', order: 'Buyurtma', no_orders_hint: '«Menyu» bo‘limida birinchi buyurtmani bering',
      balance: 'Balans', profile: 'Profil', name: 'Ism va familiya', phone: 'Telefon',
      save: 'Saqlash', topup: 'Balansni to‘ldirish', support: 'Yordam', edit: 'Profilni tahrirlash',
      lang: 'Til', open_in_tg: 'Telegram’da ochish',
      browser_note: 'Bu — vitrina. Buyurtma berish uchun ilovani Telegram’da oching.',
      order_ok: 'Buyurtma qabul qilindi! №', saved: 'Saqlandi ✅', err: 'Xatolik, keyinroq urinib ko‘ring',
      err_balance: 'Balansda mablag‘ yetarli emas', err_empty: 'Savat bo‘sh',
      need_address: 'Avval profilda yetkazib berish manzilini kiriting',
      st_pending: 'Kutilmoqda', st_confirmed: 'Qabul qilindi', st_cooking: 'Tayyorlanmoqda',
      st_delivering: 'Yetkazilmoqda', st_done: 'Yetkazildi', st_cancelled: 'Bekor qilindi',
      pcs: 'dona', placing: 'Rasmiylashtirilmoqda…',
      // ro‘yxatdan o‘tish
      reg_title: 'Ro‘yxatdan o‘tish', reg_intro: 'Buyurtma berish uchun ma’lumotlarni to‘ldiring',
      reg_save: 'Ro‘yxatdan o‘tish', reg_done: 'Xush kelibsiz! 🎉', last_name: 'Familiya',
      // admin
      tab_admin: 'Admin', adm_orders: 'Buyurtmalar', adm_menu: 'Menyu', adm_users: 'Foydalanuvchilar',
      adm_deposits: 'Depozitlar', adm_settings: 'Sozlamalar', adm_no_orders: 'Faol buyurtmalar yo‘q',
      act_confirm: 'Qabul', act_cooking: 'Tayyorlanmoqda', act_delivering: 'Kuryerga', act_done: 'Yetkazildi',
      act_cancel: 'Bekor qilish', adm_add_dish: '➕ Taom qo‘shish', adm_active: 'Faol', adm_hidden: 'Yashirin',
      adm_hide: 'Yashirish', adm_show: 'Ko‘rsatish', adm_edit: 'Tahrirlash', adm_delete: 'O‘chirish',
      adm_save: 'Saqlash', adm_price: 'Narx', adm_category: 'Kategoriya', adm_photo: 'Rasm (URL yoki file_id)',
      adm_photo_upload: '📷 Rasm yuklash', uploading: 'Rasm yuklanmoqda…',
      adm_name_ru: 'Nomi (RU)', adm_name_uz: 'Nomi (UZ)', adm_desc_ru: 'Tavsif (RU)', adm_desc_uz: 'Tavsif (UZ)',
      adm_search_user: 'Telefon, @nik yoki ID', adm_search: 'Qidirish', adm_role: 'Rol', adm_topup: 'To‘ldirish',
      adm_amount: 'Summa', adm_topup_done: 'Balans to‘ldirildi ✅', adm_support: '«Yordam» tugmasi',
      adm_topup_tg: 'To‘ldirish uchun Telegram', adm_topup_phone: 'To‘ldirish uchun telefon',
      adm_saved: 'Saqlandi ✅', confirm_delete: 'Taom o‘chirilsinmi?', adm_new_dish: 'Yangi taom', adm_create: 'Yaratish',
      adm_user_nf: 'Foydalanuvchi topilmadi', adm_orders_active: 'Faol', adm_orders_all: 'Hammasi', adm_found: 'Jami',
    },
  };

  var state = {
    lang: 'ru',
    tab: 'menu',
    menu: [],          // [{id, category, name_ru,...}]
    cart: {},          // { itemId: qty }
    me: null,          // профиль
    config: null,      // публичная конфигурация
    payFromBalance: false,
    comment: '',
    theme: 'auto',                   // auto | light | dark
    adminSection: 'orders',          // активный раздел админки
    admin: { ordersFilter: 'active', users: [], editDish: null }, // временные данные админки
  };

  function t(key) { return (I18N[state.lang] && I18N[state.lang][key]) || key; }
  function dishName(it) { return (state.lang === 'uz' ? it.name_uz : it.name_ru) || it.name_ru || it.name_uz || ''; }
  function dishDesc(it) { return (state.lang === 'uz' ? it.description_uz : it.description_ru) || it.description_ru || ''; }
  function money(n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // ---------------- API ----------------
  function api(method, path, body) {
    var opts = { method: method, headers: {} };
    if (initData) opts.headers['X-Telegram-Init-Data'] = initData;
    if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    return fetch('/api' + path, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) { var e = new Error(data.error || 'http_' + r.status); e.status = r.status; e.code = data.error; throw e; }
        return data;
      });
    });
  }

  // ---------------- UI helpers ----------------
  var viewEl = document.getElementById('view');
  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2600);
  }
  function haptic(type) { try { tg && tg.HapticFeedback && tg.HapticFeedback.impactOccurred(type || 'light'); } catch (e) {} }

  function cartCount() { var n = 0; for (var k in state.cart) n += state.cart[k]; return n; }
  function cartTotal() {
    var total = 0;
    for (var id in state.cart) {
      var it = state.menu.find(function (m) { return m.id === Number(id); });
      if (it) total += Number(it.price) * state.cart[id];
    }
    return total;
  }
  function updateBadge() {
    var b = document.getElementById('cartBadge');
    var n = cartCount();
    if (n > 0) { b.hidden = false; b.textContent = n; } else { b.hidden = true; }
  }

  // ---------------- Render: tabs ----------------
  function setTab(tab) {
    state.tab = tab;
    document.body.className = 'tab-' + tab; // для адаптивных стилей (@media)
    var tabs = document.querySelectorAll('.tab');
    tabs.forEach(function (el) { el.classList.toggle('active', el.getAttribute('data-tab') === tab); });
    render();
  }

  function applyStaticI18n() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.getElementById('langBtn').textContent = state.lang.toUpperCase();
  }

  // ---------------- Render: menu ----------------
  function viewMenu() {
    if (!state.menu.length) {
      return '<div class="empty"><span class="em-ic">🍽</span>' + esc(t('menu_empty')) + '</div>';
    }
    var cats = [
      { key: 'main', title: t('cat_main') },
      { key: 'drink', title: t('cat_drink') },
      { key: 'dessert', title: t('cat_dessert') },
    ];
    var html = '';
    if (!inTelegram) html += '<div class="banner">🌐 ' + esc(t('browser_note')) + browserCta() + '</div>';
    cats.forEach(function (c) {
      var items = state.menu.filter(function (m) { return m.category === c.key; });
      if (!items.length) return;
      html += '<div class="section-title">' + esc(c.title) + '</div>';
      items.forEach(function (it) {
        var qty = state.cart[it.id] || 0;
        var photo = it.photo_url
          ? '<img class="dish-photo" loading="lazy" src="/api/menu/' + it.id + '/photo" alt="" onerror="this.outerHTML=\'<div class=\\\'dish-photo placeholder\\\'>🍽</div>\'" />'
          : '<div class="dish-photo placeholder">🍽</div>';
        var desc = dishDesc(it) ? '<p class="dish-desc">' + esc(dishDesc(it)) + '</p>' : '';
        var control = qty > 0
          ? '<div class="stepper">' +
              '<button class="step-btn minus" data-dec="' + it.id + '">−</button>' +
              '<span class="step-qty">' + qty + '</span>' +
              '<button class="step-btn" data-inc="' + it.id + '">+</button>' +
            '</div>'
          : '<button class="add-btn" data-inc="' + it.id + '">' + esc(t('add')) + '</button>';
        html += '<div class="card"><div class="dish">' +
          photo +
          '<div class="dish-info">' +
            '<p class="dish-name">' + esc(dishName(it)) + '</p>' + desc +
            '<span class="dish-price">' + money(it.price) + ' ' + esc(t('currency')) + '</span>' +
          '</div>' + control +
        '</div></div>';
      });
    });
    return html;
  }

  function browserCta() {
    var u = state.config && state.config.botUsername;
    if (!u) return '';
    return '<br><a class="btn" style="margin-top:10px;text-decoration:none" href="https://t.me/' + esc(u) + '">' + esc(t('open_in_tg')) + '</a>';
  }

  // ---------------- Render: cart ----------------
  function viewCart() {
    var ids = Object.keys(state.cart);
    if (!ids.length) {
      return '<div class="empty"><span class="em-ic">🛒</span>' + esc(t('cart_empty')) + '</div>';
    }
    var html = '<div class="card">';
    ids.forEach(function (id) {
      var it = state.menu.find(function (m) { return m.id === Number(id); });
      if (!it) return;
      var qty = state.cart[id];
      html += '<div class="cart-row">' +
        '<span class="ci-name">' + esc(dishName(it)) + '</span>' +
        '<div class="stepper">' +
          '<button class="step-btn minus" data-dec="' + it.id + '">−</button>' +
          '<span class="step-qty">' + qty + '</span>' +
          '<button class="step-btn" data-inc="' + it.id + '">+</button>' +
        '</div>' +
        '<span class="ci-sum">' + money(it.price * qty) + '</span>' +
      '</div>';
    });
    html += '<div class="summary"><span>' + esc(t('cart_total')) + '</span><span>' + money(cartTotal()) + ' ' + esc(t('currency')) + '</span></div>';
    html += '</div>';

    if (!inTelegram) {
      return html + '<div class="banner">🌐 ' + esc(t('browser_note')) + browserCta() + '</div>';
    }

    // Адрес из профиля
    var addr = state.me && state.me.address ? state.me.address : '';
    html += '<div class="field"><label>' + esc(t('address')) + '</label><input id="cartAddr" value="' + esc(addr) + '" /></div>';

    // Комментарий
    html += '<div class="field"><label>' + esc(t('comment')) + '</label>' +
      '<textarea id="cartComment" placeholder="' + esc(t('comment_ph')) + '">' + esc(state.comment) + '</textarea></div>';

    // Оплата
    var canBalance = state.me && Number(state.me.balance) >= cartTotal();
    html += '<div class="section-title">' + esc(t('pay_method')) + '</div><div class="pay-opts">';
    html += '<div class="pay-opt ' + (state.payFromBalance && canBalance ? 'active ' : '') + (canBalance ? '' : 'disabled') + '" data-pay="balance">' +
      '<span class="radio"></span><span>' + esc(t('pay_balance')) +
      (state.me ? ' (' + money(state.me.balance) + ' ' + esc(t('currency')) + ')' : '') + '</span></div>';
    html += '<div class="pay-opt ' + (!state.payFromBalance || !canBalance ? 'active' : '') + '" data-pay="cash">' +
      '<span class="radio"></span><span>' + esc(t('pay_cash')) + '</span></div>';
    html += '</div>';

    html += '<button class="btn" id="checkoutBtn">' + esc(t('checkout')) + ' · ' + money(cartTotal()) + ' ' + esc(t('currency')) + '</button>';
    return html;
  }

  // ---------------- Render: orders ----------------
  function viewOrders(orders) {
    if (!inTelegram) return '<div class="empty"><span class="em-ic">📦</span>' + esc(t('browser_note')) + browserCta() + '</div>';
    if (!orders) return '<div class="loader">…</div>';
    if (!orders.length) {
      return '<div class="empty"><span class="em-ic">📦</span>' + esc(t('orders_empty')) + '<br><small>' + esc(t('no_orders_hint')) + '</small></div>';
    }
    var html = '';
    orders.forEach(function (o) {
      var items = o.items.map(function (it) {
        var nm = state.lang === 'uz' ? it.name_uz : it.name_ru;
        return esc(nm) + ' ×' + it.quantity;
      }).join(', ');
      var d = o.created_at ? new Date(o.created_at) : null;
      var dateStr = d ? d.toLocaleDateString() + ' ' + d.toLocaleTimeString().slice(0, 5) : '';
      html += '<div class="card order-card">' +
        '<div class="order-head"><span class="order-id">' + esc(t('order')) + ' #' + o.id + '</span>' +
        '<span class="status-pill st-' + o.status + '">' + esc(t('st_' + o.status)) + '</span></div>' +
        '<div class="order-items">' + items + '</div>' +
        '<div class="order-total">' + money(o.total_amount) + ' ' + esc(t('currency')) + '</div>' +
        (dateStr ? '<div class="order-date">' + esc(dateStr) + '</div>' : '') +
      '</div>';
    });
    return html;
  }

  // ---------------- Render: profile ----------------
  function viewProfile() {
    if (!inTelegram || !state.me) {
      return '<div class="empty"><span class="em-ic">👤</span>' + esc(t('browser_note')) + browserCta() + '</div>';
    }
    var m = state.me;
    var html = '<div class="card balance-card"><div class="bc-label">' + esc(t('balance')) + '</div>' +
      '<div class="bc-value">' + money(m.balance) + ' ' + esc(t('currency')) + '</div></div>';

    html += '<div class="field"><label>' + esc(t('name')) + '</label><input id="pfName" value="' + esc(((m.first_name || '') + ' ' + (m.last_name || '')).trim()) + '" /></div>';
    html += '<div class="field"><label>' + esc(t('phone')) + '</label><input id="pfPhone" value="' + esc(m.phone || '') + '" /></div>';
    html += '<div class="field"><label>' + esc(t('address')) + '</label><input id="pfAddr" value="' + esc(m.address || '') + '" /></div>';
    html += '<button class="btn" id="saveProfile">' + esc(t('save')) + '</button>';

    // Поддержка / пополнение
    var cfg = state.config || {};
    if (cfg.topup && (cfg.topup.telegram || cfg.topup.phone)) {
      var topupLink = linkFor(cfg.topup.telegram) || (cfg.topup.phone ? 'tel:' + cfg.topup.phone : null);
      if (topupLink) html += '<a class="btn secondary" style="text-decoration:none" href="' + esc(topupLink) + '" target="_blank">💳 ' + esc(t('topup')) + '</a>';
    }
    if (cfg.support) {
      var sup = linkFor(cfg.support);
      if (sup) html += '<a class="btn secondary" style="text-decoration:none" href="' + esc(sup) + '" target="_blank">🆘 ' + esc(t('support')) + '</a>';
    }

    // Переключатель языка
    html += '<button class="btn secondary" id="toggleLang">🌐 ' + esc(t('lang')) + ': ' + state.lang.toUpperCase() + '</button>';
    return html;
  }

  // @username / https://t.me/... / телефон -> ссылка
  function linkFor(v) {
    if (!v) return null;
    v = String(v).trim();
    if (/^https?:\/\//i.test(v)) return v;
    if (v.charAt(0) === '@') return 'https://t.me/' + v.slice(1);
    if (/^\+?\d[\d\s\-()]+$/.test(v)) return 'tel:' + v.replace(/[^\d+]/g, '');
    return 'https://t.me/' + v.replace(/^@/, '');
  }

  // ---------------- Registration ----------------
  function viewRegister() {
    var m = state.me || {};
    var html = '<div class="section-title">' + esc(t('reg_title')) + '</div>';
    html += '<div class="banner">📝 ' + esc(t('reg_intro')) + '</div>';
    html += '<div class="field"><label>' + esc(t('name')) + '</label><input id="rgName" value="' + esc(((m.first_name || '') + ' ' + (m.last_name || '')).trim()) + '" placeholder="' + esc(t('name')) + '" /></div>';
    html += '<div class="field"><label>' + esc(t('phone')) + '</label><input id="rgPhone" value="' + esc(m.phone || '') + '" placeholder="+998…" /></div>';
    html += '<div class="field"><label>' + esc(t('address')) + '</label><input id="rgAddr" value="' + esc(m.address || '') + '" /></div>';
    html += '<button class="btn" id="rgSave">' + esc(t('reg_save')) + '</button>';
    return html;
  }

  function bindRegister() {
    var btn = document.getElementById('rgSave');
    if (btn) btn.onclick = function () {
      var name = (document.getElementById('rgName').value || '').trim().replace(/\s+/g, ' ');
      var phone = (document.getElementById('rgPhone').value || '').trim();
      var addr = (document.getElementById('rgAddr').value || '').trim();
      if (!name || !phone || !addr) { toast(t('err')); return; }
      var parts = name.split(' ');
      btn.disabled = true; btn.textContent = '…';
      api('PUT', '/me', { first_name: parts[0], last_name: parts.slice(1).join(' '), phone: phone, address: addr, language: state.lang })
        .then(function (me) { state.me = me; updateAdminTab(); haptic('medium'); toast(t('reg_done')); setTab('menu'); })
        .catch(function (e) { toast(e.code === 'invalid_phone' ? t('phone') + ' ✗' : t('err')); btn.disabled = false; btn.textContent = t('reg_save'); });
    };
  }

  // ---------------- Admin ----------------
  function renderAdmin() {
    var secs = [
      ['orders', t('adm_orders')], ['menu', t('adm_menu')], ['users', t('adm_users')],
      ['deposits', t('adm_deposits')], ['settings', t('adm_settings')],
    ];
    var nav = '<div class="adm-nav">' + secs.map(function (s) {
      return '<button class="adm-navbtn ' + (state.adminSection === s[0] ? 'active' : '') + '" data-sec="' + s[0] + '">' + esc(s[1]) + '</button>';
    }).join('') + '</div>';
    viewEl.innerHTML = nav + '<div id="admBody"><div class="loader">…</div></div>';
    viewEl.querySelectorAll('[data-sec]').forEach(function (b) {
      b.onclick = function () { state.adminSection = b.getAttribute('data-sec'); renderAdmin(); };
    });
    var body = document.getElementById('admBody');
    if (state.adminSection === 'orders') admOrders(body);
    else if (state.adminSection === 'menu') admMenu(body);
    else if (state.adminSection === 'users') admUsers(body);
    else if (state.adminSection === 'deposits') admDeposits(body);
    else if (state.adminSection === 'settings') admSettings(body);
  }

  function admApi(method, path, body) { return api(method, '/admin' + path, body); }

  // Загрузка фото: шлём бинарь файла, получаем Telegram file_id
  function uploadPhoto(file, onDone) {
    var opts = { method: 'POST', headers: { 'Content-Type': file.type || 'image/jpeg' }, body: file };
    if (initData) opts.headers['X-Telegram-Init-Data'] = initData;
    fetch('/api/admin/upload', opts)
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) throw d; return d; }); })
      .then(function (d) { onDone(d.file_id); })
      .catch(function () { toast(t('err')); onDone(null); });
  }

  // ----- Заказы -----
  function admOrders(body) {
    var f = state.admin.ordersFilter;
    var tabs = '<div class="seg">' +
      '<button class="' + (f === 'active' ? 'on' : '') + '" data-f="active">' + esc(t('adm_orders_active')) + '</button>' +
      '<button class="' + (f === 'all' ? 'on' : '') + '" data-f="all">' + esc(t('adm_orders_all')) + '</button></div>';
    body.innerHTML = tabs + '<div class="loader">…</div>';
    var bindSeg = function () {
      body.querySelectorAll('[data-f]').forEach(function (b) {
        b.onclick = function () { state.admin.ordersFilter = b.getAttribute('data-f'); admOrders(body); };
      });
    };
    bindSeg();
    admApi('GET', '/orders?filter=' + f).then(function (orders) {
      var list = orders.map(admOrderCard).join('') || '<div class="empty">' + esc(t('adm_no_orders')) + '</div>';
      body.innerHTML = tabs + list;
      bindSeg();
      bindOrderActions(body);
    }).catch(function () { body.innerHTML = tabs + '<div class="empty">' + esc(t('err')) + '</div>'; bindSeg(); });
  }

  function admOrderCard(o) {
    var items = o.items.map(function (it) { return esc(state.lang === 'uz' ? it.name_uz : it.name_ru) + ' ×' + it.quantity; }).join(', ');
    var next = {
      pending: [['confirmed', 'act_confirm'], ['cancelled', 'act_cancel']],
      confirmed: [['cooking', 'act_cooking'], ['cancelled', 'act_cancel']],
      cooking: [['delivering', 'act_delivering'], ['cancelled', 'act_cancel']],
      delivering: [['done', 'act_done'], ['cancelled', 'act_cancel']],
    }[o.status] || [];
    var btns = next.map(function (a) {
      return '<button class="chip ' + (a[0] === 'cancelled' ? 'chip-danger' : '') + '" data-oid="' + o.id + '" data-st="' + a[0] + '">' + esc(t(a[1])) + '</button>';
    }).join('');
    return '<div class="card order-card">' +
      '<div class="order-head"><span class="order-id">#' + o.id + ' · ' + esc(o.client.name || '-') + '</span>' +
      '<span class="status-pill st-' + o.status + '">' + esc(t('st_' + o.status)) + '</span></div>' +
      '<div class="order-items">' + items + '</div>' +
      '<div class="order-items">📍 ' + esc(o.delivery_address || '-') + ' · 📞 ' + esc(o.client.phone || '-') + '</div>' +
      (o.comment ? '<div class="order-items">📝 ' + esc(o.comment) + '</div>' : '') +
      '<div class="order-total">' + money(o.total_amount) + ' ' + esc(t('currency')) + '</div>' +
      (btns ? '<div class="chips">' + btns + '</div>' : '') +
    '</div>';
  }

  function bindOrderActions(body) {
    body.querySelectorAll('[data-st]').forEach(function (b) {
      b.onclick = function () {
        b.disabled = true;
        admApi('POST', '/orders/' + b.getAttribute('data-oid') + '/status', { status: b.getAttribute('data-st') })
          .then(function () { haptic('light'); admOrders(body); })
          .catch(function () { toast(t('err')); b.disabled = false; });
      };
    });
  }

  // ----- Меню -----
  function admMenu(body) {
    body.innerHTML = '<div class="loader">…</div>';
    admApi('GET', '/menu').then(function (items) {
      var html = '<button class="btn" id="admAddDish">' + esc(t('adm_add_dish')) + '</button>';
      html += items.map(admDishCard).join('');
      body.innerHTML = html;
      document.getElementById('admAddDish').onclick = function () { state.admin.editDish = { isNew: true, category: 'main' }; renderDishForm(body); };
      bindDishActions(body);
    }).catch(function () { body.innerHTML = '<div class="empty">' + esc(t('err')) + '</div>'; });
  }

  function admDishCard(d) {
    var dot = d.is_active ? '🟢' : '🔴';
    var thumb = d.photo_url
      ? '<img class="dish-photo" style="width:46px;height:46px" loading="lazy" src="/api/menu/' + d.id + '/photo" alt="" onerror="this.outerHTML=\'<div class=\\\'dish-photo placeholder\\\' style=\\\'width:46px;height:46px;font-size:20px\\\'>🍽</div>\'" />'
      : '<div class="dish-photo placeholder" style="width:46px;height:46px;font-size:20px">🍽</div>';
    return '<div class="card" style="padding:12px">' +
      '<div style="display:flex;gap:10px;align-items:center">' + thumb +
      '<div style="flex:1;display:flex;justify-content:space-between;gap:8px;align-items:center">' +
      '<b>' + dot + ' ' + esc(state.lang === 'uz' ? d.name_uz || d.name_ru : d.name_ru) + '</b>' +
      '<span class="dish-price">' + money(d.price) + ' ' + esc(t('currency')) + '</span></div></div>' +
      '<div class="order-items">' + esc(t('cat_' + d.category)) + '</div>' +
      '<div class="chips">' +
        '<button class="chip" data-edit="' + d.id + '">✏️ ' + esc(t('adm_edit')) + '</button>' +
        '<button class="chip" data-toggle="' + d.id + '" data-act="' + (d.is_active ? 'false' : 'true') + '">' + (d.is_active ? esc(t('adm_hide')) : esc(t('adm_show'))) + '</button>' +
        '<button class="chip chip-danger" data-del="' + d.id + '">🗑 ' + esc(t('adm_delete')) + '</button>' +
      '</div></div>';
  }

  function bindDishActions(body) {
    body.querySelectorAll('[data-toggle]').forEach(function (b) {
      b.onclick = function () {
        admApi('PUT', '/menu/' + b.getAttribute('data-toggle'), { is_active: b.getAttribute('data-act') === 'true' })
          .then(function () { admMenu(body); }).catch(function () { toast(t('err')); });
      };
    });
    body.querySelectorAll('[data-del]').forEach(function (b) {
      b.onclick = function () {
        if (!confirm(t('confirm_delete'))) return;
        admApi('DELETE', '/menu/' + b.getAttribute('data-del')).then(function () { admMenu(body); }).catch(function () { toast(t('err')); });
      };
    });
    body.querySelectorAll('[data-edit]').forEach(function (b) {
      b.onclick = function () {
        admApi('GET', '/menu').then(function (items) {
          var d = items.find(function (x) { return x.id === Number(b.getAttribute('data-edit')); });
          state.admin.editDish = Object.assign({ isNew: false }, d);
          renderDishForm(body);
        });
      };
    });
  }

  function renderDishForm(body) {
    var d = state.admin.editDish || {};
    function fld(id, label, v) { return '<div class="field"><label>' + esc(label) + '</label><input id="' + id + '" value="' + esc(v == null ? '' : v) + '" /></div>'; }
    var cats = ['main', 'drink', 'dessert'].map(function (c) {
      return '<option value="' + c + '"' + (d.category === c ? ' selected' : '') + '>' + esc(t('cat_' + c)) + '</option>';
    }).join('');
    var html = '<div class="section-title">' + esc(d.isNew ? t('adm_new_dish') : t('adm_edit')) + '</div>';
    html += fld('dfNameRu', t('adm_name_ru'), d.name_ru);
    html += fld('dfNameUz', t('adm_name_uz'), d.name_uz);
    html += fld('dfDescRu', t('adm_desc_ru'), d.description_ru);
    html += fld('dfDescUz', t('adm_desc_uz'), d.description_uz);
    html += '<div class="field"><label>' + esc(t('adm_category')) + '</label><select id="dfCat">' + cats + '</select></div>';
    html += fld('dfPrice', t('adm_price'), d.price);
    // Загрузка фото с диска + превью
    var prevShown = !!(d.id && d.photo_url);
    html += '<div class="field"><label>' + esc(t('adm_photo_upload')) + '</label>' +
      '<input type="file" accept="image/*" id="dfPhotoFile" />' +
      '<img id="dfPrev" class="dish-photo" style="width:104px;height:104px;margin-top:8px;' + (prevShown ? '' : 'display:none') + '"' +
        (prevShown ? ' src="/api/menu/' + d.id + '/photo"' : '') + ' alt="" /></div>';
    html += fld('dfPhoto', t('adm_photo'), d.photo_url);
    html += '<button class="btn" id="dfSave">' + esc(d.isNew ? t('adm_create') : t('adm_save')) + '</button>';
    html += '<button class="btn secondary" id="dfBack">←</button>';
    body.innerHTML = html;
    var fileInp = document.getElementById('dfPhotoFile');
    if (fileInp) fileInp.onchange = function () {
      var f = fileInp.files && fileInp.files[0];
      if (!f) return;
      var prevImg = document.getElementById('dfPrev');
      try { if (prevImg) { prevImg.src = URL.createObjectURL(f); prevImg.style.display = ''; } } catch (e) {}
      toast(t('uploading'));
      uploadPhoto(f, function (fid) {
        if (fid) { document.getElementById('dfPhoto').value = fid; toast(t('adm_saved')); }
      });
    };
    document.getElementById('dfBack').onclick = function () { state.admin.editDish = null; admMenu(body); };
    document.getElementById('dfSave').onclick = function () {
      var payload = {
        name_ru: val('dfNameRu'), name_uz: val('dfNameUz'),
        description_ru: val('dfDescRu'), description_uz: val('dfDescUz'),
        category: document.getElementById('dfCat').value,
        price: Number(val('dfPrice').replace(/\s/g, '').replace(',', '.')),
        photo_url: val('dfPhoto'),
      };
      var req = d.isNew ? admApi('POST', '/menu', payload) : admApi('PUT', '/menu/' + d.id, payload);
      req.then(function () { state.admin.editDish = null; toast(t('adm_saved')); admMenu(body); })
        .catch(function () { toast(t('err')); });
    };
  }
  function val(id) { var e = document.getElementById(id); return e ? (e.value || '').trim() : ''; }

  // ----- Пользователи (все + живой фильтр) -----
  function admUsers(body) {
    body.innerHTML = '<div class="field"><input id="usrQ" placeholder="🔍 ' + esc(t('adm_search_user')) + '" /></div>' +
      '<div id="usrRes"><div class="loader">…</div></div>';
    admApi('GET', '/users').then(function (users) {
      state.admin.users = users;
      renderUserList();
      var inp = document.getElementById('usrQ');
      if (inp) inp.oninput = renderUserList;
    }).catch(function () {
      var res = document.getElementById('usrRes');
      if (res) res.innerHTML = '<div class="empty">' + esc(t('err')) + '</div>';
    });
  }

  function renderUserList() {
    var res = document.getElementById('usrRes');
    if (!res) return;
    var q = (val('usrQ') || '').toLowerCase().replace(/^@/, '');
    var list = state.admin.users || [];
    var filtered = !q ? list : list.filter(function (u) {
      return (u.name || '').toLowerCase().indexOf(q) >= 0
        || (u.username || '').toLowerCase().indexOf(q) >= 0
        || (u.phone || '').toLowerCase().indexOf(q) >= 0
        || String(u.telegram_id).indexOf(q) >= 0;
    });
    if (!filtered.length) { res.innerHTML = '<div class="empty">' + esc(t('adm_user_nf')) + '</div>'; return; }
    res.innerHTML = '<div class="section-title">' + esc(t('adm_found')) + ': ' + filtered.length + '</div>' +
      filtered.map(admUserCard).join('');
    bindRoleButtons(res);
  }

  function admUserCard(u) {
    var roles = ['client', 'cook', 'courier', 'admin'].map(function (r) {
      return '<button class="chip ' + (u.role === r ? 'on' : '') + '" data-uid="' + u.telegram_id + '" data-role="' + r + '">' + r + '</button>';
    }).join('');
    return '<div class="card" style="padding:12px">' +
      '<b>' + esc(u.name || '-') + '</b>' +
      (u.username ? '<div class="order-items">🔗 @' + esc(u.username) + '</div>' : '') +
      '<div class="order-items">ID: ' + esc(u.telegram_id) + ' · 📞 ' + esc(u.phone || '-') + '</div>' +
      '<div class="order-items">' + esc(t('balance')) + ': ' + money(u.balance) + ' ' + esc(t('currency')) + '</div>' +
      '<div class="order-items">' + esc(t('adm_role')) + ':</div><div class="chips">' + roles + '</div></div>';
  }

  function bindRoleButtons(res) {
    res.querySelectorAll('[data-role]').forEach(function (b) {
      b.onclick = function () {
        var uid = b.getAttribute('data-uid'), role = b.getAttribute('data-role');
        admApi('POST', '/users/' + uid + '/role', { role: role })
          .then(function () {
            haptic('light'); toast(t('adm_saved'));
            var u = (state.admin.users || []).find(function (x) { return String(x.telegram_id) === String(uid); });
            if (u) u.role = role;
            renderUserList();
          })
          .catch(function () { toast(t('err')); });
      };
    });
  }

  // ----- Депозиты (поиск пользователя → пополнение) -----
  function admDeposits(body) {
    body.innerHTML =
      '<div class="field"><label>' + esc(t('adm_search_user')) + '</label><input id="dpQ" placeholder="' + esc(t('adm_search_user')) + '" /></div>' +
      '<button class="btn" id="dpSearch">' + esc(t('adm_search')) + '</button><div id="dpRes"></div>';
    var doSearch = function () {
      var q = val('dpQ');
      if (!q) return;
      var res = document.getElementById('dpRes');
      res.innerHTML = '<div class="loader">…</div>';
      admApi('GET', '/users?q=' + encodeURIComponent(q)).then(function (users) {
        if (!users.length) { res.innerHTML = '<div class="empty">' + esc(t('adm_user_nf')) + '</div>'; return; }
        res.innerHTML = users.map(dpUserCard).join('');
        bindDeposit(res);
      }).catch(function () { res.innerHTML = '<div class="empty">' + esc(t('err')) + '</div>'; });
    };
    document.getElementById('dpSearch').onclick = doSearch;
    var inp = document.getElementById('dpQ');
    if (inp) inp.onkeydown = function (e) { if (e.key === 'Enter') doSearch(); };
  }

  function dpUserCard(u) {
    return '<div class="card" style="padding:12px">' +
      '<b>' + esc(u.name || '-') + '</b>' +
      (u.username ? '<div class="order-items">🔗 @' + esc(u.username) + '</div>' : '') +
      '<div class="order-items">ID: ' + esc(u.telegram_id) + ' · 📞 ' + esc(u.phone || '-') + '</div>' +
      '<div class="order-total">' + esc(t('balance')) + ': ' + money(u.balance) + ' ' + esc(t('currency')) + '</div>' +
      '<div class="field" style="margin:10px 0 0"><input class="dpAmount" data-uid="' + esc(u.telegram_id) + '" inputmode="numeric" placeholder="' + esc(t('adm_amount')) + '" /></div>' +
      '<button class="btn dpDo" data-uid="' + esc(u.telegram_id) + '">' + esc(t('adm_topup')) + '</button>' +
    '</div>';
  }

  function bindDeposit(res) {
    res.querySelectorAll('.dpDo').forEach(function (b) {
      b.onclick = function () {
        var uid = b.getAttribute('data-uid');
        var input = res.querySelector('.dpAmount[data-uid="' + uid + '"]');
        var amount = Number(((input && input.value) || '').replace(/\s/g, '').replace(',', '.'));
        if (!(amount > 0)) { toast(t('err')); return; }
        b.disabled = true;
        admApi('POST', '/deposits', { query: uid, amount: amount }).then(function (r) {
          haptic('medium'); toast(t('adm_topup_done') + ' · ' + money(r.balance) + ' ' + t('currency'));
          document.getElementById('dpSearch').click(); // обновить баланс в карточке
        }).catch(function (e) { toast(e.code === 'user_not_found' ? t('adm_user_nf') : t('err')); b.disabled = false; });
      };
    });
  }

  // ----- Настройки -----
  function admSettings(body) {
    body.innerHTML = '<div class="loader">…</div>';
    admApi('GET', '/settings').then(function (s) {
      body.innerHTML =
        '<div class="field"><label>' + esc(t('adm_support')) + '</label><input id="stSupport" value="' + esc(s.support || '') + '" placeholder="@username / https://t.me/… / +998…" /></div>' +
        '<div class="field"><label>' + esc(t('adm_topup_tg')) + '</label><input id="stTg" value="' + esc(s.topup_telegram || '') + '" /></div>' +
        '<div class="field"><label>' + esc(t('adm_topup_phone')) + '</label><input id="stPhone" value="' + esc(s.topup_phone || '') + '" /></div>' +
        '<button class="btn" id="stSave">' + esc(t('adm_save')) + '</button>';
      document.getElementById('stSave').onclick = function () {
        admApi('PUT', '/settings', { support: val('stSupport'), topup_telegram: val('stTg'), topup_phone: val('stPhone') })
          .then(function () { haptic('light'); toast(t('adm_saved')); api('GET', '/config').then(function (c) { state.config = c; }); })
          .catch(function () { toast(t('err')); });
      };
    }).catch(function () { body.innerHTML = '<div class="empty">' + esc(t('err')) + '</div>'; });
  }

  // ---------------- Main render ----------------
  function needsRegistration() {
    return inTelegram && state.me && !state.me.registered;
  }

  // Вкладка «Админ» — только зарегистрированным администраторам.
  function updateAdminTab() {
    var at = document.getElementById('adminTab');
    if (!at) return;
    var show = !!(state.me && state.me.is_admin && state.me.registered);
    at.hidden = !show;
    if (!show && state.tab === 'admin') setTab('menu');
  }

  function render() {
    applyStaticI18n();
    // Гейт регистрации: пока профиль не заполнен — показываем форму регистрации
    if (needsRegistration()) { viewEl.innerHTML = viewRegister(); bindRegister(); updateBadge(); window.scrollTo(0, 0); return; }

    if (state.tab === 'menu') { viewEl.innerHTML = viewMenu(); bindMenu(); }
    else if (state.tab === 'cart') { viewEl.innerHTML = viewCart(); bindCart(); }
    else if (state.tab === 'orders') { renderOrders(); }
    else if (state.tab === 'profile') { viewEl.innerHTML = viewProfile(); bindProfile(); }
    else if (state.tab === 'admin') { renderAdmin(); }
    updateBadge();
    window.scrollTo(0, 0);
  }

  function renderOrders() {
    if (!inTelegram) { viewEl.innerHTML = viewOrders(null); return; }
    viewEl.innerHTML = '<div class="loader">…</div>';
    api('GET', '/orders').then(function (orders) {
      if (state.tab === 'orders') viewEl.innerHTML = viewOrders(orders);
    }).catch(function () {
      if (state.tab === 'orders') viewEl.innerHTML = viewOrders([]);
    });
  }

  // ---------------- Bindings ----------------
  function changeQty(id, delta) {
    id = Number(id);
    var q = (state.cart[id] || 0) + delta;
    if (q <= 0) delete state.cart[id]; else state.cart[id] = q;
    // если сумма изменилась — сбросить выбор баланса, если не хватает
    haptic('light');
    render();
  }

  function bindMenu() {
    viewEl.querySelectorAll('[data-inc]').forEach(function (b) {
      b.onclick = function () { changeQty(b.getAttribute('data-inc'), 1); };
    });
    viewEl.querySelectorAll('[data-dec]').forEach(function (b) {
      b.onclick = function () { changeQty(b.getAttribute('data-dec'), -1); };
    });
  }

  function bindCart() {
    viewEl.querySelectorAll('[data-inc]').forEach(function (b) {
      b.onclick = function () { changeQty(b.getAttribute('data-inc'), 1); };
    });
    viewEl.querySelectorAll('[data-dec]').forEach(function (b) {
      b.onclick = function () { changeQty(b.getAttribute('data-dec'), -1); };
    });
    viewEl.querySelectorAll('[data-pay]').forEach(function (el) {
      el.onclick = function () {
        if (el.classList.contains('disabled')) return;
        state.payFromBalance = el.getAttribute('data-pay') === 'balance';
        render();
      };
    });
    var cmt = document.getElementById('cartComment');
    if (cmt) cmt.oninput = function () { state.comment = cmt.value; };
    var btn = document.getElementById('checkoutBtn');
    if (btn) btn.onclick = checkout;
  }

  function bindProfile() {
    var save = document.getElementById('saveProfile');
    if (save) save.onclick = saveProfile;
    var tl = document.getElementById('toggleLang');
    if (tl) tl.onclick = function () { setLang(state.lang === 'ru' ? 'uz' : 'ru', true); };
  }

  // ---------------- Actions ----------------
  function checkout() {
    if (!cartCount()) { toast(t('err_empty')); return; }
    var addrInput = document.getElementById('cartAddr');
    var addr = addrInput ? addrInput.value.trim() : (state.me && state.me.address);
    if (!addr) { toast(t('need_address')); setTab('profile'); return; }

    var btn = document.getElementById('checkoutBtn');
    if (btn) { btn.disabled = true; btn.textContent = t('placing'); }

    var items = Object.keys(state.cart).map(function (id) { return { id: Number(id), quantity: state.cart[id] }; });

    var chain = Promise.resolve();
    // если адрес изменили — обновим профиль
    if (state.me && addr !== state.me.address) {
      chain = api('PUT', '/me', { address: addr }).then(function (me) { state.me = me; }).catch(function () {});
    }
    chain.then(function () {
      return api('POST', '/orders', { items: items, payFromBalance: state.payFromBalance, comment: state.comment });
    }).then(function (order) {
      state.cart = {}; state.comment = ''; state.payFromBalance = false;
      haptic('medium');
      // обновить баланс
      return api('GET', '/me').then(function (me) { state.me = me; }).catch(function () {}).then(function () {
        toast(t('order_ok') + order.id);
        setTab('orders');
      });
    }).catch(function (e) {
      if (e.code === 'insufficient_balance') toast(t('err_balance'));
      else if (e.code === 'empty_cart') toast(t('err_empty'));
      else toast(t('err'));
      render();
    });
  }

  function saveProfile() {
    var name = (document.getElementById('pfName').value || '').trim().replace(/\s+/g, ' ');
    var phone = (document.getElementById('pfPhone').value || '').trim();
    var addr = (document.getElementById('pfAddr').value || '').trim();
    var parts = name.split(' ');
    var body = {
      first_name: parts[0] || '',
      last_name: parts.slice(1).join(' '),
      phone: phone,
      address: addr,
    };
    var btn = document.getElementById('saveProfile');
    if (btn) btn.disabled = true;
    api('PUT', '/me', body).then(function (me) {
      state.me = me; haptic('medium'); toast(t('saved')); render();
    }).catch(function (e) {
      toast(e.code === 'invalid_phone' ? t('phone') + ' ✗' : t('err'));
      if (btn) btn.disabled = false;
    });
  }

  function setLang(lang, persist) {
    state.lang = lang;
    document.documentElement.lang = lang;
    render();
    if (persist && inTelegram) api('PUT', '/me', { language: lang }).catch(function () {});
  }

  // ---------------- Тема ----------------
  var THEME_ORDER = ['auto', 'light', 'dark'];
  var THEME_ICON = { auto: '🌗', light: '☀️', dark: '🌙' };

  function applyTheme(mode) {
    if (THEME_ORDER.indexOf(mode) === -1) mode = 'auto';
    state.theme = mode;
    if (mode === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', mode);
    var btn = document.getElementById('themeBtn');
    if (btn) btn.textContent = THEME_ICON[mode];
    try { localStorage.setItem('eatfit_theme', mode); } catch (e) {}
  }

  function cycleTheme() {
    var i = THEME_ORDER.indexOf(state.theme || 'auto');
    applyTheme(THEME_ORDER[(i + 1) % THEME_ORDER.length]);
    haptic('light');
  }

  function initTheme() {
    var saved = 'auto';
    try { saved = localStorage.getItem('eatfit_theme') || 'auto'; } catch (e) {}
    applyTheme(saved);
    var btn = document.getElementById('themeBtn');
    if (btn) btn.onclick = cycleTheme;
  }

  // ---------------- Init ----------------
  function init() {
    // язык: из Telegram пользователя, иначе ru
    var tgLang = tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.language_code;
    state.lang = tgLang === 'uz' ? 'uz' : 'ru';

    document.getElementById('langBtn').onclick = function () { setLang(state.lang === 'ru' ? 'uz' : 'ru', true); };
    initTheme();
    document.querySelectorAll('.tab').forEach(function (el) {
      el.onclick = function () { setTab(el.getAttribute('data-tab')); };
    });
    setTab('menu');

    // Параллельно грузим конфиг, меню и (если в Telegram) профиль
    var jobs = [
      api('GET', '/config').then(function (c) { state.config = c; }).catch(function () {}),
      api('GET', '/menu').then(function (m) { state.menu = m; }).catch(function () {}),
    ];
    if (inTelegram) {
      jobs.push(api('GET', '/me').then(function (me) {
        state.me = me;
        if (me.language) state.lang = me.language;
        updateAdminTab();
      }).catch(function () {}));
    }
    Promise.all(jobs).then(function () {
      // Если требуется регистрация — сразу показываем форму
      render();
    });
  }

  init();
})();
