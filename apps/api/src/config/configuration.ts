// Типизированная конфигурация приложения из переменных окружения.
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
  },
});
