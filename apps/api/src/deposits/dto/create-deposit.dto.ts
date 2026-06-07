import { IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreateDepositDto {
  @IsUUID()
  clientId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;
}
