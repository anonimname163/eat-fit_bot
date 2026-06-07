import { Category } from '@eatfit/shared';

export interface CartItemView {
  menuItemId: string;
  category: Category;
  nameRu: string;
  nameUz: string;
  price: string;
  quantity: number;
  lineTotal: string;
}

export class CartResponseDto {
  items: CartItemView[];
  total: string;

  constructor(items: CartItemView[], total: string) {
    this.items = items;
    this.total = total;
  }
}
