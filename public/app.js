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
          ? '<img class="dish-photo" src="' + esc(it.photo_url) + '" alt="" onerror="this.classList.add(\'placeholder\');this.removeAttribute(\'src\');this.textContent=\'🍽\'" />'
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

  // ---------------- Main render ----------------
  function render() {
    applyStaticI18n();
    if (state.tab === 'menu') { viewEl.innerHTML = viewMenu(); bindMenu(); }
    else if (state.tab === 'cart') { viewEl.innerHTML = viewCart(); bindCart(); }
    else if (state.tab === 'orders') { renderOrders(); }
    else if (state.tab === 'profile') { viewEl.innerHTML = viewProfile(); bindProfile(); }
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

  // ---------------- Init ----------------
  function init() {
    // язык: из Telegram пользователя, иначе ru
    var tgLang = tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.language_code;
    state.lang = tgLang === 'uz' ? 'uz' : 'ru';

    document.getElementById('langBtn').onclick = function () { setLang(state.lang === 'ru' ? 'uz' : 'ru', true); };
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
      }).catch(function () {}));
    }
    Promise.all(jobs).then(function () { render(); });
  }

  init();
})();
