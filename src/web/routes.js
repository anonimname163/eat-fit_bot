// REST API для Mini App / сайта.
const express = require('express');
const db = require('../db');
const menu = require('../handlers/menu');
const notify = require('../utils/notify');
const settings = require('../settings');
const orderService = require('../services/orders');
const { requireAuth } = require('./auth');

/**
 * Собрать роутер API.
 * @param {import('node-telegram-bot-api')} bot
 */
function buildRouter(bot) {
  const router = express.Router();
  const botToken = process.env.BOT_TOKEN;
  const auth = requireAuth(botToken);

  // ---- Публичные эндпоинты (без авторизации) ----

  // Публичная конфигурация для фронтенда
  router.get('/config', async (req, res) => {
    try {
      const [support, topupTg, topupPhone] = await Promise.all([
        settings.getSetting(settings.KEYS.SUPPORT_CONTACT),
        settings.getSetting(settings.KEYS.TOPUP_TELEGRAM),
        settings.getSetting(settings.KEYS.TOPUP_PHONE),
      ]);
      res.json({
        botUsername: process.env.BOT_USERNAME || null,
        support: support || null,
        topup: { telegram: topupTg || null, phone: topupPhone || null },
      });
    } catch (err) {
      console.error('[ERROR] GET /config:', err.message);
      res.status(500).json({ error: 'server_error' });
    }
  });

  // Витрина меню — активные блюда (двуязычные поля, локализация на фронте)
  router.get('/menu', async (req, res) => {
    try {
      const items = await menu.allActiveItems();
      res.json(items.map((i) => ({
        id: i.id,
        category: i.category,
        name_ru: i.name_ru,
        name_uz: i.name_uz,
        description_ru: i.description_ru,
        description_uz: i.description_uz,
        price: Number(i.price),
        photo_url: i.photo_url || null,
      })));
    } catch (err) {
      console.error('[ERROR] GET /menu:', err.message);
      res.status(500).json({ error: 'server_error' });
    }
  });

  // ---- Авторизованные эндпоинты (нужен валидный initData) ----

  // Профиль + баланс
  router.get('/me', auth, (req, res) => {
    const c = req.client;
    res.json({
      id: c.id,
      first_name: c.first_name,
      last_name: c.last_name,
      phone: c.phone,
      address: c.address,
      language: c.language || 'ru',
      balance: Number(c.balance),
      role: c.role || 'client',
    });
  });

  // Обновление профиля (имя/фамилия/телефон/адрес/язык)
  router.put('/me', auth, async (req, res) => {
    try {
      const b = req.body || {};
      const fields = [];
      const values = [];
      let n = 1;

      if (typeof b.first_name === 'string' && b.first_name.trim()) {
        fields.push(`first_name = $${n++}`); values.push(b.first_name.trim().slice(0, 100));
      }
      if (typeof b.last_name === 'string') {
        fields.push(`last_name = $${n++}`); values.push(b.last_name.trim().slice(0, 100) || null);
      }
      if (typeof b.phone === 'string') {
        const cleaned = b.phone.replace(/[^\d+]/g, '');
        if (cleaned.replace(/\D/g, '').length < 7) {
          return res.status(400).json({ error: 'invalid_phone' });
        }
        fields.push(`phone = $${n++}`); values.push(cleaned.slice(0, 20));
      }
      if (typeof b.address === 'string' && b.address.trim()) {
        fields.push(`address = $${n++}`); values.push(b.address.trim());
      }
      if (b.language === 'ru' || b.language === 'uz') {
        fields.push(`language = $${n++}`); values.push(b.language);
      }

      if (!fields.length) return res.status(400).json({ error: 'nothing_to_update' });

      values.push(req.client.id);
      const { rows } = await db.query(
        `UPDATE clients SET ${fields.join(', ')} WHERE id = $${n} RETURNING *`,
        values
      );
      const c = rows[0];
      res.json({
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        phone: c.phone,
        address: c.address,
        language: c.language || 'ru',
        balance: Number(c.balance),
        role: c.role || 'client',
      });
    } catch (err) {
      console.error('[ERROR] PUT /me:', err.message);
      res.status(500).json({ error: 'server_error' });
    }
  });

  // Заказы клиента со статусами и позициями
  router.get('/orders', auth, async (req, res) => {
    try {
      const { rows: orders } = await db.query(
        `SELECT id, status, total_amount, paid_from_balance, delivery_address, comment, created_at
           FROM orders WHERE client_id = $1 ORDER BY id DESC LIMIT 30`,
        [req.client.id]
      );
      const result = [];
      for (const o of orders) {
        const items = await notify.getOrderItems(o.id);
        result.push({
          id: o.id,
          status: o.status,
          total_amount: Number(o.total_amount),
          paid_from_balance: Number(o.paid_from_balance),
          delivery_address: o.delivery_address,
          comment: o.comment,
          created_at: o.created_at,
          items: items.map((it) => ({
            name_ru: it.name_ru,
            name_uz: it.name_uz,
            category: it.category,
            quantity: it.quantity,
            price: Number(it.price_at_order),
          })),
        });
      }
      res.json(result);
    } catch (err) {
      console.error('[ERROR] GET /orders:', err.message);
      res.status(500).json({ error: 'server_error' });
    }
  });

  // Создание заказа из Mini App
  router.post('/orders', auth, async (req, res) => {
    try {
      const b = req.body || {};
      const lines = Array.isArray(b.items)
        ? b.items.map((it) => ({ itemId: Number(it.id), quantity: Number(it.quantity) }))
        : [];
      const order = await orderService.placeOrder(bot, req.client, lines, {
        payFromBalance: Boolean(b.payFromBalance),
        comment: typeof b.comment === 'string' ? b.comment : null,
      });
      res.status(201).json({
        id: order.id,
        status: order.status,
        total_amount: Number(order.total_amount),
        paid_from_balance: Number(order.paid_from_balance),
      });
    } catch (err) {
      if (err.message === 'INSUFFICIENT_BALANCE') return res.status(409).json({ error: 'insufficient_balance' });
      if (err.message === 'EMPTY_CART') return res.status(400).json({ error: 'empty_cart' });
      if (err.message === 'ITEM_NOT_FOUND') return res.status(400).json({ error: 'item_not_found' });
      console.error('[ERROR] POST /orders:', err.message);
      res.status(500).json({ error: 'server_error' });
    }
  });

  return router;
}

module.exports = { buildRouter };
