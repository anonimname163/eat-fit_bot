import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Category, Language, Role } from '@eatfit/shared';
import type { Context } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { Client } from '../clients/entities/client.entity';
import { MenuRepository } from '../menu/menu.repository';
import { CartService } from '../orders/cart/cart.service';
import { Lang, t, categoryName, pick, formatMoney, esc } from './i18n/bot-i18n';
import { mainMenuKeyboard } from './telegram-keyboards';

/**
 * Презентационный слой бота. Витрина — ОДНО редактируемое сообщение (edit-in-place):
 * степперы ➖/➕ меняют его на месте, «Оформить заказ» редактирует его же в оплату —
 * новые сообщения не плодятся, меню «исчезает» при оформлении.
 */
@Injectable()
export class BotUiService {
  private readonly adminIds: string[];
  private readonly webAppUrl?: string;

  constructor(
    private readonly config: ConfigService,
    private readonly menu: MenuRepository,
    private readonly cart: CartService,
  ) {
    this.adminIds = this.config.get<string[]>('telegram.adminIds') ?? [];
    this.webAppUrl = this.config.get<string>('bot.webAppUrl');
  }

  /** Админ — по списку ADMIN_TELEGRAM_IDS или роли в БД (паритет + домен). */
  isAdmin(client: Client): boolean {
    return this.adminIds.includes(String(client.telegramId)) || client.role === Role.Admin;
  }

  langOf(client: Client): Lang {
    return client.language ?? Language.Ru;
  }

  async showMainMenu(ctx: Context, client: Client): Promise<void> {
    const lang = this.langOf(client);
    await ctx.reply(
      t(lang, 'main_menu'),
      mainMenuKeyboard(lang, client.role, this.isAdmin(client), this.webAppUrl),
    );
  }

  /** Текст + клавиатура витрины (общее для отправки и редактирования). */
  async buildMenuView(client: Client): Promise<{ text: string; reply_markup: { inline_keyboard: InlineKeyboardButton[][] } }> {
    const lang = this.langOf(client);
    const items = await this.menu.findActive();
    let cart: { items: { menuItemId: string; quantity: number }[]; total: string };
    try {
      cart = await this.cart.getCart();
    } catch {
      cart = { items: [], total: '0' };
    }
    const qty = new Map(cart.items.map((i) => [i.menuItemId, i.quantity]));

    const lines = [`🍽 <b>${esc(t(lang, 'menu_title'))}</b>`];
    const kb: InlineKeyboardButton[][] = [];
    const categories: Category[] = [Category.Main, Category.Drink, Category.Dessert];
    for (const cat of categories) {
      const catItems = items.filter((i) => i.category === cat);
      if (!catItems.length) continue;
      kb.push([{ text: `— ${categoryName(lang, cat)} —`, callback_data: 'qty:noop' }]);
      for (const item of catItems) {
        const q = qty.get(item.id) ?? 0;
        const name = pick(lang, item.nameRu, item.nameUz);
        const price = formatMoney(item.price.toString());
        kb.push([
          { text: '➖', callback_data: `qty:dec:${item.id}` },
          { text: `${name} · ${price}${q ? ` ·${q}` : ''}`, callback_data: 'qty:noop' },
          { text: '➕', callback_data: `qty:inc:${item.id}` },
        ]);
      }
    }

    if (!items.length) {
      lines.push('', esc(t(lang, 'menu_empty')));
    } else if (Number(cart.total) > 0) {
      lines.push('', `🛒 <b>${esc(t(lang, 'cart_total'))}: ${esc(formatMoney(cart.total))} ${esc(t(lang, 'currency'))}</b>`);
      kb.push([{ text: t(lang, 'btn_checkout'), callback_data: 'cart:checkout' }]);
    } else {
      lines.push('', esc(t(lang, 'add_something_else')));
    }

    return { text: lines.join('\n'), reply_markup: { inline_keyboard: kb } };
  }

  /** Отправить новое сообщение витрины. */
  async sendMenu(ctx: Context, client: Client): Promise<void> {
    const view = await this.buildMenuView(client);
    await ctx.reply(view.text, { parse_mode: 'HTML', reply_markup: view.reply_markup });
  }

  /** Перерисовать витрину в текущем сообщении (по callback). */
  async editMenu(ctx: Context, client: Client): Promise<void> {
    const view = await this.buildMenuView(client);
    try {
      await ctx.editMessageText(view.text, { parse_mode: 'HTML', reply_markup: view.reply_markup });
    } catch {
      /* «not modified» / сообщение устарело — игнор */
    }
  }
}
