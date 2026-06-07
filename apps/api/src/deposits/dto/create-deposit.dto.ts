import { IsNumber, IsPositive, IsUUID, Max } from 'class-validator';

// Верхний предел одной операции с балансом (анти-«толстый палец»/абьюз). numeric(12,2) в БД
// держит до ~10 млрд; ставим разумный бизнес-потолок заметно ниже.
export const MAX_BALANCE_OP = 100_000_000;

export class CreateDepositDto {
  @IsUUID()
  clientId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(MAX_BALANCE_OP)
  amount!: number;
}
