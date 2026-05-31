// Ежедневный отчёт (итоги дня) для админ-группы.
const db = require('./db');
const { formatMoney, esc } = require('./i18n');

/**
 * Границы «сегодня» в локальной таймзоне (UTC + offset) в виде UTC-времён.
 * @param {number} offsetHours смещение от UTC (Узбекистан = +5)
 * @returns {{ start: Date, end: Date, label: string }}
 */
function dayRange(offsetHours) {
  const localMs = Date.now() + offsetHours * 3600000;
  const d = new Date(localMs);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  const startUtcMs = Date.UTC(y, m, day) - offsetHours * 3600000;
  const endUtcMs = startUtcMs + 24 * 3600000;
  const label = `${String(day).padStart(2, '0')}.${String(m + 1).padStart(2, '0')}.${y}`;
  return { start: new Date(startUtcMs), end: new Date(endUtcMs), label };
}

/** Собрать текст отчёта за период [start, end). */
async function buildReportText(start, end, label) {
  // Сводка по заказам
  const { rows: o } = await db.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'done')::int AS done,
       COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
       COUNT(*) FILTER (WHERE status NOT IN ('done','cancelled'))::int AS active,
       COALESCE(SUM(total_amount) FILTER (WHERE status = 'done'), 0) AS revenue,
       COALESCE(SUM(paid_from_balance) FILTER (WHERE status = 'done'), 0) AS from_balance
     FROM orders
     WHERE created_at >= $1 AND created_at < $2`,
    [start, end]
  );
  const s = o[0];

  // Топ блюд (по доставленным)
  const { rows: top } = await db.query(
    `SELECT m.name_ru, SUM(oi.quantity)::int AS qty
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN menu_items m ON m.id = oi.menu_item_id
      WHERE o.created_at >= $1 AND o.created_at < $2 AND o.status = 'done'
      GROUP BY m.name_ru
      ORDER BY qty DESC
      LIMIT 5`,
    [start, end]
  );

  // Пополнения и новые клиенты
  const { rows: dep } = await db.query(
    `SELECT COALESCE(SUM(amount), 0) AS sum, COUNT(*)::int AS c
       FROM deposits WHERE created_at >= $1 AND created_at < $2`,
    [start, end]
  );
  const { rows: cl } = await db.query(
    `SELECT COUNT(*)::int AS c FROM clients WHERE created_at >= $1 AND created_at < $2`,
    [start, end]
  );

  const avg = s.done > 0 ? Number(s.revenue) / s.done : 0;

  const lines = [];
  lines.push(`📊 <b>Итоги дня — ${esc(label)}</b>`);
  lines.push('─────────────────');
  lines.push(`🧾 Заказов всего: <b>${s.total}</b>`);
  lines.push(`✅ Доставлено: ${s.done}`);
  lines.push(`⏳ В процессе: ${s.active}`);
  lines.push(`❌ Отменено: ${s.cancelled}`);
  lines.push('─────────────────');
  lines.push(`💰 Выручка (доставлено): <b>${esc(formatMoney(s.revenue))} сум</b>`);
  lines.push(`💳 Из них с баланса: ${esc(formatMoney(s.from_balance))} сум`);
  lines.push(`🧮 Средний чек: ${esc(formatMoney(avg))} сум`);
  lines.push('─────────────────');
  if (top.length) {
    lines.push('🏆 Топ блюд:');
    top.forEach((it, i) => lines.push(`${i + 1}. ${esc(it.name_ru)} — ${it.qty}`));
  } else {
    lines.push('🏆 Топ блюд: —');
  }
  lines.push('─────────────────');
  lines.push(`➕ Пополнений: ${dep[0].c} на ${esc(formatMoney(dep[0].sum))} сум`);
  lines.push(`👥 Новых клиентов: ${cl[0].c}`);

  return lines.join('\n');
}

/** Отправить отчёт за сегодня в указанный чат. */
async function sendDailyReport(bot, chatId) {
  const offset = Number(process.env.TZ_OFFSET_HOURS || 5);
  const { start, end, label } = dayRange(offset);
  const text = await buildReportText(start, end, label);
  await bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
}

/**
 * Запустить планировщик: раз в день в DAILY_REPORT_HOUR (локального времени)
 * отправлять итоги дня в админ-группу.
 */
function startDailyReportScheduler(bot) {
  const offset = Number(process.env.TZ_OFFSET_HOURS || 5);
  const reportHour = Number(process.env.DAILY_REPORT_HOUR || 23);
  let lastSentLabel = null;

  setInterval(async () => {
    try {
      const localMs = Date.now() + offset * 3600000;
      const hour = new Date(localMs).getUTCHours();
      const { label } = dayRange(offset);
      if (hour === reportHour && lastSentLabel !== label) {
        lastSentLabel = label;
        const groupId = process.env.ADMIN_GROUP_ID;
        if (groupId) {
          await sendDailyReport(bot, groupId);
          console.log(`[INFO] Итоги дня (${label}) отправлены в админ-группу`);
        }
      }
    } catch (err) {
      console.error('[ERROR] daily report scheduler:', err.message);
    }
  }, 60000);

  console.log(`[INFO] Планировщик итогов дня: ${reportHour}:00 (UTC+${offset})`);
}

module.exports = { dayRange, buildReportText, sendDailyReport, startDailyReportScheduler };
