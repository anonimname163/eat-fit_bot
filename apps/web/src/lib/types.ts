import { Category, Language, OrderStatus, PaymentMethod, Role } from '@eatfit/shared';

/** Зеркала response-DTO API (деньги — строки). Источник enum'ов — libs/shared. */

export interface ClientDto {
  id: string;
  telegramId: string;
  name: string;
  username: string | null;
  phone: string | null;
  address: string | null;
  language: Language;
  role: Role;
  balance: string;
  createdAt: string;
}

export interface MenuItemDto {
  id: string;
  category: Category;
  nameRu: string;
  nameUz: string;
  descriptionRu: string | null;
  descriptionUz: string | null;
  price: string;
  hasPhoto: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CartItemDto {
  menuItemId: string;
  category: Category;
  nameRu: string;
  nameUz: string;
  price: string;
  quantity: number;
  lineTotal: string;
}

export interface CartDto {
  items: CartItemDto[];
  total: string;
}

export interface OrderItemDto {
  menuItemId: string;
  nameRu: string;
  nameUz: string;
  quantity: number;
  priceAtOrder: string;
  lineTotal: string;
}

export interface OrderDto {
  id: string;
  status: OrderStatus;
  total: string;
  address: string;
  comment: string | null;
  paymentMethod: PaymentMethod;
  createdAt: string;
  items: OrderItemDto[];
}

export interface DepositDto {
  id: string;
  clientId: string;
  amount: string;
  adminTelegramId: string;
  createdAt: string;
}

export interface SettingsDto {
  topupTelegram: string | null;
  topupPhone: string | null;
  supportContact: string | null;
}

export interface AuthResponse {
  accessToken: string;
  client: ClientDto;
}
