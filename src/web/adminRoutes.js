// Админ-API для Mini App: заказы, меню, пользователи, депозиты, настройки.
// Все маршруты защищены requireAdmin (ADMIN_TELEGRAM_IDS).
const express = require('express');
const db = require('../db');
const notify = require('../utils/notify');
const settings = require('../settings');
const { t, formatMoney, esc } = require('../i18n');
const orderStatus = require('../services/orderStatus');
const { requireAdmin } = require('./auth');

const ROLES = ['client', 'cook', 'courier', 'admin'];
const CATEGORIES = ['main', 'drink', 'dessert'];

function dishOut(i) {
  return {
    id: i.id, category: i.category,
    name_ru: i.name_ru, name_uz: i.name_uz,
    description_ru: i.description_ru, description_uz: i.description_uz,
    price: Number(i.price), photo_url: i.photo_url || null,
    is_active: i.is_active,
  };
}

/**
 * @param {import('node-telegram-bot-api')} bot
 */
function buildAdminRouter(bot) {
  const router = express.Router();
  router.use(requireAdmin(process.env.BOT_TOKEN));

  // ---------------- Статистика ----------------
  router.get('/stats', async (_req, res) => {
    try {
      const { rows } = await db.query(
        `SELECT status, COUNT(*)::int AS count, COALESCE(SUM(total_amount),0)::float AS sum
           FROM orders GROUP BY status`
      );
      res.json(rows);
    } catch (err) { fail(res, err, 'GET /admin/stats'); }
  });

  // ---------------- Заказы ----------------
  router.get('/orders', async (req, res) => {
    try {
      const filter = req.query.filter || 'active';
      const where = filter === 'all' ? '' : `WHERE o.status NOT IN ('done','cancelled')`;
      const { rows: orders } = await db.query(
        `SELECT o.*, c.first_name, c.last_name, c.phone
           FROM orders o JOIN clients c ON c.id = o.client_id
           ${where}
          ORDER BY o.id DESC LIMIT 50`
      );
      const result = [];
      for (const o of orders) {
        const items = await notify.getOrderItems(o.id);
        result.push({
          id: o.id, status: o.status,
          total_amount: Number(o.total_amount),
          paid_from_balance: Number(o.paid_from_balance),
          delivery_address: o.delivery_address, comment: o.comment,
          created_at: o.created_at,
          client: { name: `${o.first_name || ''} ${o.last_name || ''}`.trim(), phone: o.phone },
          items: items.map((it) => ({ name_ru: it.name_ru, name_uz: it.name_uz, quantity: it.quantity })),
        });
      }
      res.json(result);
    } catch (err) { fail(res, err, 'GET /admin/orders'); }
  });

  router.post('/orders/:id/status', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const status = (req.body || {}).status;
      const { order, refund } = await orderStatus.changeStatus(bot, id, status);
      res.json({ id: order.id, status: order.status, refund });
    } catch (err) {
      if (err.message === 'BAD_STATUS') return res.status(400).json({ error: 'bad_status' });
      if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'not_found' });
      if (err.message === 'ALREADY_CLOSED') return res.status(409).json({ error: 'already_closed' });
      fail(res, err, 'POST /admin/orders/:id/status');
    }
  });

  // ---------------- Меню ----------------
  router.get('/menu', async (_req, res) => {
    try {
      const { rows } = await db.query('SELECT * FROM menu_items ORDER BY id');
      res.json(rows.map(dishOut));
    } catch (err) { fail(res, err, 'GET /admin/menu'); }
  });

  router.post('/menu', async (req, res) => {
    try {
      const d = normalizeDish(req.body || {});
      if (!d.name_ru) return res.status(400).json({ error: 'name_required' });
      if (!CATEGORIES.includes(d.category)) return res.status(400).json({ error: 'bad_category' });
      if (!(d.price > 0)) return res.status(400).json({ error: 'bad_price' });
      const { rows } = await db.query(
        `INSERT INTO menu_items (name_ru, name_uz, description_ru, description_uz, category, price, photo_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [d.name_ru, d.name_uz, d.description_ru, d.description_uz, d.category, d.price, d.photo_url]
      );
      res.status(201).json(dishOut(rows[0]));
    } catch (err) { fail(res, err, 'POST /admin/menu'); }
  });

  router.put('/menu/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const b = req.body || {};
      const sets = [];
      const vals = [];
      let n = 1;
      const map = {
        name_ru: 'name_ru', name_uz: 'name_uz',
        description_ru: 'description_ru', description_uz: 'description_uz',
      };
      for (const k in map) {
        if (typeof b[k] === 'string') { sets.push(`${map[k]} = $${n++}`); vals.push(b[k].trim() || null); }
      }
      if (b.category !== undefined) {
        if (!CATEGORIES.includes(b.category)) return res.status(400).json({ error: 'bad_category' });
        sets.push(`category = $${n++}`); vals.push(b.category);
      }
      if (b.price !== undefined) {
        const p = Number(b.price);
        if (!(p > 0)) return res.status(400).json({ error: 'bad_price' });
        sets.push(`price = $${n++}`); vals.push(p);
      }
      if (b.photo_url !== undefined) { sets.push(`photo_url = $${n++}`); vals.push(b.photo_url ? String(b.photo_url).trim() : null); }
      if (typeof b.is_active === 'boolean') { sets.push(`is_active = $${n++}`); vals.push(b.is_active); }

      if (!sets.length) return res.status(400).json({ error: 'nothing_to_update' });
      vals.push(id);
      const { rows } = await db.query(`UPDATE menu_items SET ${sets.join(', ')} WHERE id = $${n} RETURNING *`, vals);
      if (!rows.length) return res.status(404).json({ error: 'not_found' });
      res.json(dishOut(rows[0]));
    } catch (err) { fail(res, err, 'PUT /admin/menu/:id'); }
  });

  router.delete('/menu/:id', async (req, res) => {
    try {
      await db.query('DELETE FROM menu_items WHERE id = $1', [Number(req.params.id)]);
      res.json({ ok: true });
    } catch (err) { fail(res, err, 'DELETE /admin/menu/:id'); }
  });

  // Загрузка фото блюда: принимаем бинарь изображения, отправляем в Telegram
  // (в личку загрузившего админа) и возвращаем file_id для сохранения в блюде.
  router.post('/upload', express.raw({ type: ['image/*', 'application/octet-stream'], limit: '10mb' }), async (req, res) => {
    try {
      if (!req.body || !req.body.length) return res.status(400).json({ error: 'no_file' });
      const target = req.tgUser.id; // личный чат админа с ботом
      const contentType = req.get('Content-Type') || 'image/jpeg';
      const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
      const sent = await bot.sendPhoto(
        target,
        req.body,
        { caption: '📸 Фото для меню' },
        { filename: `dish.${ext}`, contentType }
      );
      const photos = sent.photo || [];
      const fileId = photos.length ? photos[photos.length - 1].file_id : null;
      if (!fileId) return res.status(500).json({ error: 'upload_failed' });
      res.json({ file_id: fileId });
    } catch (err) { fail(res, err, 'POST /admin/upload'); }
  });

  // ---------------- Пользователи ----------------
  router.get('/users', async (req, res) => {
    try {
      const q = String(req.query.q || '').trim().replace(/^@/, '');
      if (!q) return res.json([]);
      const { rows } = await db.query(
        `SELECT id, telegram_id, first_name, last_name, username, phone, balance, role
           FROM clients
          WHERE phone ILIKE $1 OR username ILIKE $1 OR CAST(telegram_id AS TEXT) = $2
          ORDER BY id LIMIT 10`,
        [`%${q}%`, q]
      );
      res.json(rows.map((u) => ({
        id: u.id, telegram_id: String(u.telegram_id),
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        username: u.username || null,
        phone: u.phone, balance: Number(u.balance), role: u.role,
      })));
    } catch (err) { fail(res, err, 'GET /admin/users'); }
  });

  router.post('/users/:telegramId/role', async (req, res) => {
    try {
      const role = (req.body || {}).role;
      if (!ROLES.includes(role)) return res.status(400).json({ error: 'bad_role' });
      const { rows } = await db.query(
        'UPDATE clients SET role = $1 WHERE telegram_id = $2 RETURNING telegram_id, role',
        [role, req.params.telegramId]
      );
      if (!rows.length) return res.status(404).json({ error: 'not_found' });
      console.log(`[INFO] Роль ${req.params.telegramId} → ${role} (через Mini App, админ ${req.tgUser.id})`);
      res.json({ telegram_id: String(rows[0].telegram_id), role: rows[0].role });
    } catch (err) { fail(res, err, 'POST /admin/users/:id/role'); }
  });

  // ---------------- Депозиты ----------------
  router.post('/deposits', async (req, res) => {
    try {
      const b = req.body || {};
      const amount = Number(b.amount);
      if (!(amount > 0)) return res.status(400).json({ error: 'bad_amount' });

      const q = String(b.query || '').trim().replace(/^@/, '');
      const { rows: found } = await db.query(
        `SELECT * FROM clients WHERE CAST(telegram_id AS TEXT) = $1 OR phone ILIKE $2 ORDER BY id LIMIT 1`,
        [q, `%${q}%`]
      );
      if (!found.length) return res.status(404).json({ error: 'user_not_found' });
      const client = found[0];

      await db.withTransaction(async (tx) => {
        await tx.query('UPDATE clients SET balance = balance + $1 WHERE id = $2', [amount, client.id]);
        await tx.query(
          `INSERT INTO deposits (client_id, amount, note, created_by) VALUES ($1, $2, $3, $4)`,
          [client.id, amount, 'admin top-up (mini app)', req.tgUser.id]
        );
      });
      console.log(`[INFO] Пополнение #${client.id} на ${amount} (Mini App, админ ${req.tgUser.id})`);

      // Уведомления клиенту и в админ-группу (как в боте)
      try {
        await bot.sendMessage(client.telegram_id, `💰 +${formatMoney(amount)} ${t(client.language || 'ru', 'currency')}`);
        await notify.notifyAdminEvent(
          bot,
          `💵 <b>Пополнение баланса</b>\n👤 ${esc(`${client.first_name || ''} ${client.last_name || ''}`.trim())} (#${client.id})\n➕ ${esc(formatMoney(amount))} ${esc(t('ru', 'currency'))}\n🔑 админ: <code>${esc(req.tgUser.id)}</code>`
        );
      } catch (_) { /* игнор */ }

      const { rows: fresh } = await db.query('SELECT balance FROM clients WHERE id = $1', [client.id]);
      res.json({ ok: true, client_id: client.id, balance: Number(fresh[0].balance) });
    } catch (err) { fail(res, err, 'POST /admin/deposits'); }
  });

  // ---------------- Настройки ----------------
  router.get('/settings', async (_req, res) => {
    try {
      const [support, tg, phone] = await Promise.all([
        settings.getSetting(settings.KEYS.SUPPORT_CONTACT),
        settings.getSetting(settings.KEYS.TOPUP_TELEGRAM),
        settings.getSetting(settings.KEYS.TOPUP_PHONE),
      ]);
      res.json({ support: support || '', topup_telegram: tg || '', topup_phone: phone || '' });
    } catch (err) { fail(res, err, 'GET /admin/settings'); }
  });

  router.put('/settings', async (req, res) => {
    try {
      const b = req.body || {};
      if (typeof b.support === 'string') await settings.setSetting(settings.KEYS.SUPPORT_CONTACT, b.support.trim());
      if (typeof b.topup_telegram === 'string') await settings.setSetting(settings.KEYS.TOPUP_TELEGRAM, b.topup_telegram.trim());
      if (typeof b.topup_phone === 'string') await settings.setSetting(settings.KEYS.TOPUP_PHONE, b.topup_phone.trim());
      res.json({ ok: true });
    } catch (err) { fail(res, err, 'PUT /admin/settings'); }
  });

  return router;
}

function normalizeDish(b) {
  return {
    name_ru: (b.name_ru || '').trim(),
    name_uz: (b.name_uz || '').trim() || null,
    description_ru: (b.description_ru || '').trim() || null,
    description_uz: (b.description_uz || '').trim() || null,
    category: b.category,
    price: Number(b.price),
    photo_url: b.photo_url ? String(b.photo_url).trim() : null,
  };
}

function fail(res, err, where) {
  console.error(`[ERROR] ${where}:`, err.message);
  res.status(500).json({ error: 'server_error' });
}

module.exports = { buildAdminRouter };
