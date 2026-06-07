import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);

  // HTTP hardening
  app.use(helmet());

  // CORS строго под домен(ы) фронта; если не задано — открыто (dev).
  const corsOrigins = config.get<string[]>('cors.origins') ?? [];
  app.enableCors({ origin: corsOrigins.length > 0 ? corsOrigins : true, credentials: true });

  // Валидация входа: режем лишние поля и кидаем на неизвестные (анти mass-assignment).
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  app.enableShutdownHooks();

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);
  Logger.log(`Eat&fit API запущен на порту ${port}`, 'Bootstrap');
}

bootstrap();
