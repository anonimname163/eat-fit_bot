import * as Joi from 'joi';

// Проверка переменных окружения при старте (fail-fast).
export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  DATABASE_SSL: Joi.string().valid('true', 'false').optional(),
  TYPEORM_SYNC: Joi.string().valid('true', 'false').default('true'),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  BOT_TOKEN: Joi.string().required(),
  BOT_USERNAME: Joi.string().optional(),
}).unknown(true);
