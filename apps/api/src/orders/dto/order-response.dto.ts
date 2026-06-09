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
  number: number; // короткий последовательный номер для UI
  status: OrderStatus;
  total: string;
  address: string;
  comment: string | null;
  paymentMethod: PaymentMethod;
  createdAt: Date;
  customerName: string | null;
  customerPhone: string | null;
  items: OrderItemView[];

  constructor(
    order: Order,
    items: OrderItem[],
    customer?: { name: string | null; phone: string | null },
  ) {
    this.id = order.id;
    this.number = order.orderNumber;
    this.status = order.status;
    this.total = order.total.toString();
    this.address = order.address;
    this.comment = order.comment;
    this.paymentMethod = order.paymentMethod;
    this.createdAt = order.createdAt;
    this.customerName = customer?.name ?? null;
    this.customerPhone = customer?.phone ?? null;
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
