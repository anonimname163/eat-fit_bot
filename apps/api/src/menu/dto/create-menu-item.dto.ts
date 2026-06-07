import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import { Category } from '@eatfit/shared';

export class CreateMenuItemDto {
  @IsEnum(Category)
  category!: Category;

  @IsString()
  @IsNotEmpty()
  nameRu!: string;

  @IsString()
  @IsNotEmpty()
  nameUz!: string;

  @IsOptional()
  @IsString()
  descriptionRu?: string;

  @IsOptional()
  @IsString()
  descriptionUz?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price!: number;

  @IsOptional()
  @IsString()
  photoFileId?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  photoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Дни недели (ISO 1=Пн…7=Вс), когда блюдо в витрине. Пусто/не задано = каждый день.
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  days?: number[];
}
