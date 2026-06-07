import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
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
}
