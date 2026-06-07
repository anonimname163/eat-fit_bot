import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Transactional } from '@nestjs-cls/transactional';
import { Language, Role } from '@eatfit/shared';
import { Money } from '../common/money/money';
import { ClientRepository } from '../clients/clients.repository';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './jwt-payload';
import { verifyTelegramInitData } from './telegram-initdata';

// initData валиден ограниченное время (анти-replay).
const INITDATA_MAX_AGE_SECONDS = 86400;

@Injectable()
export class AuthService {
  constructor(
    private readonly clients: ClientRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Вход по Telegram initData: верификация → upsert клиента → выдача JWT.
   * Транзакция: апсерт идёт одной операцией.
   */
  @Transactional()
  async authenticateTelegram(initData: string): Promise<AuthResponseDto> {
    const botToken = this.config.get<string>('bot.token')!;
    const tgUser = verifyTelegramInitData(initData, botToken, INITDATA_MAX_AGE_SECONDS);

    const telegramId = String(tgUser.id);
    const adminIds = this.config.get<string[]>('telegram.adminIds') ?? [];
    const shouldBeAdmin = adminIds.includes(telegramId);
    const username = tgUser.username ?? null;

    let client = await this.clients.findByTelegramId(telegramId);

    if (!client) {
      client = await this.clients.create({
        telegramId,
        name: tgUser.first_name ?? 'Гость',
        username,
        language: tgUser.language_code === 'uz' ? Language.Uz : Language.Ru,
        role: shouldBeAdmin ? Role.Admin : Role.Client,
        balance: Money.zero(),
      });
    } else {
      // Синхронизируем username и промоутим в админы по списку (роль — только из БД/сервера).
      const promote = shouldBeAdmin && client.role === Role.Client;
      if (client.username !== username || promote) {
        client.username = username;
        if (promote) client.role = Role.Admin;
        client = await this.clients.save(client);
      }
    }

    const payload: JwtPayload = { sub: client.id, telegramId, role: client.role };
    const accessToken = await this.jwt.signAsync(payload);

    return new AuthResponseDto(accessToken, client);
  }
}
