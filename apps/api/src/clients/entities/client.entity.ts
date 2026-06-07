import { Entity, Column, Check, Index } from 'typeorm';
import { Role, Language } from '@eatfit/shared';
import { BaseEntity } from '../../common/database/base.entity';
import { Money } from '../../common/money/money';
import { moneyTransformer } from '../../common/money/money.transformer';

@Entity('clients')
@Check(`"balance" >= 0`) // инвариант неотрицательности баланса (последний рубеж в БД)
export class Client extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'bigint' })
  telegramId!: string;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  username!: string | null;

  @Column({ type: 'varchar' })
  name!: string;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', nullable: true })
  address!: string | null;

  @Column({ type: 'enum', enum: Language, default: Language.Ru })
  language!: Language;

  @Column({ type: 'enum', enum: Role, default: Role.Client })
  role!: Role;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: moneyTransformer })
  balance!: Money;
}
