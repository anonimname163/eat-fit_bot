import { IsInt, Max, Min } from 'class-validator';

export class SetQuantityDto {
  // 0 — удалить позицию из корзины.
  @IsInt()
  @Min(0)
  @Max(100)
  quantity!: number;
}
