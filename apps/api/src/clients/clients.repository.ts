import { Injectable } from '@nestjs/common';
import { EntityTarget } from 'typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { TransactionalRepository } from '../common/database/transactional-repository';
import { Client } from './entities/client.entity';

@Injectable()
export class ClientRepository extends TransactionalRepository<Client> {
  protected readonly entity: EntityTarget<Client> = Client;

  constructor(txHost: TransactionHost<TransactionalAdapterTypeOrm>) {
    super(txHost);
  }

  findByTelegramId(telegramId: string): Promise<Client | null> {
    return this.repo.findOne({ where: { telegramId } });
  }

  findById(id: string): Promise<Client | null> {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Client>): Promise<Client> {
    return this.repo.save(this.repo.create(data));
  }

  save(client: Client): Promise<Client> {
    return this.repo.save(client);
  }
}
