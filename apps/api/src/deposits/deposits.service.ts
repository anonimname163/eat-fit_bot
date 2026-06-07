import { Inject, Injectable, Optional } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ActorContextService } from '../common/cls/actor-context.service';
import { NotFoundError } from '../common/errors/domain-error';
import { Money } from '../common/money/money';
import { INotifier, NOTIFIER, NotifyGroup } from '../common/notifications/notifier';
import { ClientRepository } from '../clients/clients.repository';
import { BalanceService } from '../clients/balance/balance.service';
import { DepositRepository } from './deposit.repository';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { DepositResponseDto } from './dto/deposit-response.dto';

export interface AdminDepositResult {
  deposit: DepositResponseDto;
  balance: string;
}

@Injectable()
export class DepositsService {
  constructor(
    private readonly deposits: DepositRepository,
    private readonly clients: ClientRepository,
    private readonly balance: BalanceService,
    private readonly actorCtx: ActorContextService,
    @Optional() @Inject(NOTIFIER) private readonly notifier?: INotifier,
  ) {}

  /** Пополнение баланса админом: Deposit + проводка по балансу в одной транзакции. */
  @Transactional()
  async adminDeposit(dto: CreateDepositDto): Promise<AdminDepositResult> {
    const admin = this.actorCtx.getOrThrow();
    const target = await this.clients.findById(dto.clientId);
    if (!target) {
      throw new NotFoundError('Клиент не найден');
    }

    const amount = Money.fromMajor(dto.amount);
    const deposit = await this.deposits.create({
      clientId: target.id,
      amount,
      adminTelegramId: admin.telegramId,
    });
    const updated = await this.balance.deposit(target.id, amount);

    if (target.telegramId) {
      await this.notifier?.notifyUser(
        target.telegramId,
        `Ваш баланс пополнен на ${amount.toString()}. Текущий баланс: ${updated.balance.toString()}.`,
      );
    }
    await this.notifier?.notifyGroup(
      NotifyGroup.Admins,
      `Пополнение: ${target.name} (+${amount.toString()}). Баланс: ${updated.balance.toString()}.`,
    );

    return { deposit: new DepositResponseDto(deposit), balance: updated.balance.toString() };
  }

  /** История пополнений текущего клиента. */
  async myHistory(): Promise<DepositResponseDto[]> {
    const actor = this.actorCtx.getOrThrow();
    return this.historyFor(actor.userId);
  }

  /** История пополнений конкретного клиента (админ). */
  async historyFor(clientId: string): Promise<DepositResponseDto[]> {
    const list = await this.deposits.findByClient(clientId);
    return list.map((d) => new DepositResponseDto(d));
  }
}
