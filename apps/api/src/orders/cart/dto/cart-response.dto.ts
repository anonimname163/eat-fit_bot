import { Category } from '@eatfit/shared';

export interface CartItemView {
  menuItemId: string;
  category: Category;
  nameRu: string;
  nameUz: string;
  price: string;
  quantity: number;
  lineTotal: string;
  // Выбранная порция и её вес (для отображения и идентичности строки).
  portion: number;
  weightGrams: number | null;
}

export class CartResponseDto {
  items: CartItemView[];
  total: string;

  constructor(items: CartItemView[], total: string) {
    this.items = items;
    this.total = total;
  }
}
