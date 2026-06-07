import { Injectable } from '@nestjs/common';
import { EntityTarget } from 'typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Category } from '@eatfit/shared';
import { TransactionalRepository } from '../common/database/transactional-repository';
import { MenuItem } from './entities/menu-item.entity';

@Injectable()
export class MenuRepository extends TransactionalRepository<MenuItem> {
  protected readonly entity: EntityTarget<MenuItem> = MenuItem;

  constructor(txHost: TransactionHost<TransactionalAdapterTypeOrm>) {
    super(txHost);
  }

  /** Витрина: только активные, опционально по категории. */
  findActive(category?: Category): Promise<MenuItem[]> {
    return this.repo.find({
      where: { isActive: true, ...(category ? { category } : {}) },
      order: { category: 'ASC', createdAt: 'DESC' },
    });
  }

  /** Полный список для админки. */
  findAll(): Promise<MenuItem[]> {
    return this.repo.find({ order: { category: 'ASC', createdAt: 'DESC' } });
  }

  findById(id: string): Promise<MenuItem | null> {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<MenuItem>): Promise<MenuItem> {
    return this.repo.save(this.repo.create(data));
  }

  save(item: MenuItem): Promise<MenuItem> {
    return this.repo.save(item);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
