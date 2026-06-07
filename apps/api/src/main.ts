import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );

  const config = app.get(ConfigService);
  const port = config.get<number>('port') ?? 3000;

  await app.listen(port);
  Logger.log(`Eat&fit API запущен на порту ${port}`, 'Bootstrap');
}

bootstrap();
