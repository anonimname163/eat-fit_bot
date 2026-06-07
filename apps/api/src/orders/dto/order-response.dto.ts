import { OrderStatus, PaymentMethod } from '@eatfit/shared';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';

export interface OrderItemView {
  menuItemId: string;
  nameRu: string;
  nameUz: string;
  quantity: number;
  priceAtOrder: string;
  lineTotal: string;
}

export class OrderResponseDto {
  id: string;
  status: OrderStatus;
  total: string;
  address: string;
  comment: string | null;
  paymentMethod: PaymentMethod;
  createdAt: Date;
  items: OrderItemView[];

  constructor(order: Order, items: OrderItem[]) {
    this.id = order.id;
    this.status = order.status;
    this.total = order.total.toString();
    this.address = order.address;
    this.comment = order.comment;
    this.paymentMethod = order.paymentMethod;
    this.createdAt = order.createdAt;
    this.items = items.map((it) => ({
      menuItemId: it.menuItemId,
      nameRu: it.menuItem?.nameRu ?? '',
      nameUz: it.menuItem?.nameUz ?? '',
      quantity: it.quantity,
      priceAtOrder: it.priceAtOrder.toString(),
      lineTotal: it.priceAtOrder.multiply(it.quantity).toString(),
    }));
  }
}
