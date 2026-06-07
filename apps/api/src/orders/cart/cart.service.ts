import { Inject, Injectable } from '@nestjs/common';
import { ActorContextService } from '../../common/cls/actor-context.service';
import { ConflictError } from '../../common/errors/domain-error';
import { Money } from '../../common/money/money';
import { MenuRepository } from '../../menu/menu.repository';
import { CART_STORE, CartLine, ICartStore } from './cart-store';
import { CartItemView, CartResponseDto } from './dto/cart-response.dto';

@Injectable()
export class CartService {
  constructor(
    @Inject(CART_STORE) private readonly store: ICartStore,
    private readonly actorCtx: ActorContextService,
    private readonly menu: MenuRepository,
  ) {}

  private get clientId(): string {
    return this.actorCtx.getOrThrow().userId;
  }

  async addItem(menuItemId: string, quantity: number): Promise<CartResponseDto> {
    const item = await this.menu.findById(menuItemId);
    if (!item || !item.isActive) {
      throw new ConflictError('Блюдо недоступно');
    }
    const lines = this.store.get(this.clientId);
    const existing = lines.find((l) => l.menuItemId === menuItemId);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, 100);
    } else {
      lines.push({ menuItemId, quantity });
    }
    this.store.set(this.clientId, lines);
    return this.getCart();
  }

  async setQuantity(menuItemId: string, quantity: number): Promise<CartResponseDto> {
    let lines = this.store.get(this.clientId);
    if (quantity === 0) {
      lines = lines.filter((l) => l.menuItemId !== menuItemId);
    } else {
      const existing = lines.find((l) => l.menuItemId === menuItemId);
      if (existing) {
        existing.quantity = quantity;
      } else {
        const item = await this.menu.findById(menuItemId);
        if (!item || !item.isActive) {
          throw new ConflictError('Блюдо недоступно');
        }
        lines.push({ menuItemId, quantity });
      }
    }
    this.store.set(this.clientId, lines);
    return this.getCart();
  }

  clear(): CartResponseDto {
    this.store.clear(this.clientId);
    return new CartResponseDto([], Money.zero().toString());
  }

  /** Строит корзину с актуальными ценами из БД; недоступные позиции самоочищаются. */
  async getCart(): Promise<CartResponseDto> {
    const lines = this.store.get(this.clientId);
    const items: CartItemView[] = [];
    const kept: CartLine[] = [];
    let total = Money.zero();

    for (const line of lines) {
      const item = await this.menu.findById(line.menuItemId);
      if (!item || !item.isActive) continue;
      kept.push(line);
      const lineTotal = item.price.multiply(line.quantity);
      total = total.add(lineTotal);
      items.push({
        menuItemId: item.id,
        category: item.category,
        nameRu: item.nameRu,
        nameUz: item.nameUz,
        price: item.price.toString(),
        quantity: line.quantity,
        lineTotal: lineTotal.toString(),
      });
    }

    if (kept.length !== lines.length) {
      this.store.set(this.clientId, kept);
    }
    return new CartResponseDto(items, total.toString());
  }
}
