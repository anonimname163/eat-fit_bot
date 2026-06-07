import { Entity, Column, Index } from 'typeorm';
import { Category } from '@eatfit/shared';
import { BaseEntity } from '../../common/database/base.entity';
import { Money } from '../../common/money/money';
import { moneyTransformer } from '../../common/money/money.transformer';

@Entity('menu_items')
@Index(['isActive', 'category']) // витрина активных блюд по категориям
export class MenuItem extends BaseEntity {
  @Column({ type: 'enum', enum: Category })
  category!: Category;

  @Column({ type: 'varchar' })
  nameRu!: string;

  @Column({ type: 'varchar' })
  nameUz!: string;

  @Column({ type: 'text', nullable: true })
  descriptionRu!: string | null;

  @Column({ type: 'text', nullable: true })
  descriptionUz!: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: moneyTransformer })
  price!: Money;

  // Фото: Telegram file_id (предпочтительно) или внешний URL; отдаётся через прокси-эндпоинт.
  @Column({ type: 'varchar', nullable: true })
  photoFileId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  photoUrl!: string | null;

  // Загруженное из Mini App/сайта фото: бинарь в БД (ФС Railway эфемерна).
  // select:false — не тянуть бинарь в списочных запросах; грузим отдельно при отдаче.
  @Column({ type: 'bytea', nullable: true, select: false })
  photoData!: Buffer | null;

  // MIME загруженного фото; всегда в выборке → по нему определяем наличие фото без чтения бинаря.
  @Column({ type: 'varchar', nullable: true })
  photoMime!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
