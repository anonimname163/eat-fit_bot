import { Category } from '@eatfit/shared';
import { MenuItem } from '../entities/menu-item.entity';

/**
 * Response-DTO блюда. file_id наружу НЕ отдаём (внутреннее) — только флаг наличия фото;
 * клиент берёт фото через GET /menu/:id/photo. price — строка (Money).
 */
export class MenuItemResponseDto {
  id: string;
  category: Category;
  nameRu: string;
  nameUz: string;
  descriptionRu: string | null;
  descriptionUz: string | null;
  price: string;
  hasPhoto: boolean;
  isActive: boolean;
  days: number[];
  createdAt: Date;

  constructor(item: MenuItem) {
    this.id = item.id;
    this.category = item.category;
    this.nameRu = item.nameRu;
    this.nameUz = item.nameUz;
    this.descriptionRu = item.descriptionRu;
    this.descriptionUz = item.descriptionUz;
    this.price = item.price.toString();
    this.hasPhoto = Boolean(item.photoFileId || item.photoUrl || item.photoMime);
    this.isActive = item.isActive;
    this.days = item.days ?? [];
    this.createdAt = item.createdAt;
  }
}
