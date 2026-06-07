// Типизированная конфигурация приложения из переменных окружения.
function parseIds(csv?: string): string[] {
  return (csv ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL, // 'true' | 'false' | undefined (авто)
    synchronize: (process.env.TYPEORM_SYNC ?? 'true') === 'true',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  bot: {
    token: process.env.BOT_TOKEN,
    username: process.env.BOT_USERNAME,
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET,
  },
  telegram: {
    adminIds: parseIds(process.env.ADMIN_TELEGRAM_IDS),
    channelId: process.env.CHANNEL_ID,
    cooksGroupId: process.env.COOKS_GROUP_ID,
    couriersGroupId: process.env.COURIERS_GROUP_ID,
    adminGroupId: process.env.ADMIN_GROUP_ID,
  },
  cors: {
    origins: parseIds(process.env.CORS_ORIGINS),
  },
  reports: {
    tzOffsetHours: parseInt(process.env.TZ_OFFSET_HOURS ?? '5', 10),
    dailyReportHour: parseInt(process.env.DAILY_REPORT_HOUR ?? '19', 10),
  },
});
