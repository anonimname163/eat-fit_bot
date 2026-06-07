import { Module } from '@nestjs/common';
import { ClientRepository } from './clients.repository';

/**
 * Модуль клиентов. На этом этапе — репозиторий (нужен Auth для upsert).
 * Профиль/баланс/поиск добавятся в Epic 3.
 */
@Module({
  providers: [ClientRepository],
  exports: [ClientRepository],
})
export class ClientsModule {}
