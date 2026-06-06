// HTTP-сервер: раздаёт фронтенд Mini App / сайта и REST API.
// Запускается в том же процессе, что и бот (не мешает long polling).
const path = require('path');
const express = require('express');
const { buildRouter } = require('./routes');

/**
 * Запустить веб-сервер.
 * @param {import('node-telegram-bot-api')} bot инстанс бота (для создания заказов/уведомлений)
 * @returns {import('http').Server|null}
 */
function startWebServer(bot) {
  const port = Number(process.env.PORT) || 3000;

  const app = express();
  app.use(express.json({ limit: '256kb' }));

  // Простой запрос-лог (без тел)
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) console.log(`[WEB] ${req.method} ${req.path}`);
    next();
  });

  // API
  app.use('/api', buildRouter(bot));

  // Проверка живости
  app.get('/healthz', (_req, res) => res.json({ ok: true }));

  // Статика фронтенда (public/)
  const publicDir = path.join(__dirname, '..', '..', 'public');
  app.use(express.static(publicDir));

  // SPA-fallback: всё кроме /api отдаёт index.html
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  const server = app.listen(port, () => {
    console.log(`[INFO] Веб-сервер (Mini App) запущен на порту ${port}`);
  });
  server.on('error', (err) => {
    console.error('[ERROR] Веб-сервер:', err.message);
  });

  return server;
}

module.exports = { startWebServer };
