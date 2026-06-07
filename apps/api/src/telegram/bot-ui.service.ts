import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Category, Language, Role } from '@eatfit/shared';
import type { Context } from 'telegraf';
import { Client } from '../clients/entities/client.entity';
import { MenuItem } from '../menu/entities/menu-item.entity';
import { MenuRepository } from '../menu/menu.repository';
import { CartService } from '../orders/cart/cart.service';
import { Lang, t, categoryName, pick, formatMoney, esc } from './i18n/bot-i18n';
import { mainMenuKeyboard, stepperRow } from './telegram-keyboards';

/**
 * Презентационный слой бота: главное меню по роли и витрина блюд с карточками и степпером.
 * Данные берёт из доменных репозиториев/сервисов; «кто действует» — из CLS (actor),
 * установленного middleware.
 */
@Injectable()
export class BotUiService {
  private readonly logger = new Logger(BotUiService.name);
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

  /** Текущие количества в корзине: menuItemId → qty (для степпера). Требует actor в CLS. */
  private async cartQuantities(): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    try {
      const cart = await this.cart.getCart();
      for (const it of cart.items) map.set(it.menuItemId, it.quantity);
    } catch {
      // actor не установлен — степперы покажут 0
    }
    return map;
  }

  /** Витрина: активные блюда по категориям, карточка + степпер под каждым. */
  async renderMenu(ctx: Context, client: Client): Promise<void> {
    const lang = this.langOf(client);
    const items = await this.menu.findActive();
    if (!items.length) {
      await ctx.reply(t(lang, 'menu_empty'));
      return;
    }
    await ctx.reply(t(lang, 'menu_title'));
    const quantities = await this.cartQuantities();
    const categories: Category[] = [Category.Main, Category.Drink, Category.Dessert];
    for (const cat of categories) {
      const catItems = items.filter((i) => i.category === cat);
      if (!catItems.length) continue;
      await ctx.reply(`<b>${esc(categoryName(lang, cat))}</b>`, { parse_mode: 'HTML' });
      for (const item of catItems) {
        await this.sendDishCard(ctx, lang, item, quantities.get(item.id) ?? 0);
      }
    }
  }

  /** Карточка блюда: фото (file_id/url) или текст + ряд-степпер. */
  async sendDishCard(ctx: Context, lang: Lang, item: MenuItem, qty: number): Promise<void> {
    const name = pick(lang, item.nameRu, item.nameUz);
    const desc = pick(lang, item.descriptionRu, item.descriptionUz);
    const price = `${formatMoney(item.price.toString())} ${t(lang, 'currency')}`;
    let text = `🍽 <b>${esc(name)}</b>\n`;
    if (desc) text += `${esc(desc)}\n`;
    text += `💵 ${esc(price)}`;

    const markup = { reply_markup: { inline_keyboard: [stepperRow(lang, item.id, qty)] } };
    const photo = item.photoFileId || item.photoUrl;
    if (photo) {
      try {
        await ctx.replyWithPhoto(photo, { caption: text, parse_mode: 'HTML', ...markup });
        return;
      } catch (err) {
        this.logger.warn(`sendPhoto блюдо ${item.id}: ${(err as Error).message}`);
        await this.clearInvalidPhoto(item, (err as Error).message);
      }
    }
    await ctx.reply(text, { parse_mode: 'HTML', ...markup });
  }

  /** Сбрасываем битый file_id/url, чтобы ошибка не повторялась (паритет легаси). */
  private async clearInvalidPhoto(item: MenuItem, errMsg: string): Promise<void> {
    if (/wrong file identifier|HTTP URL|PHOTO_INVALID|wrong remote file|file_id/i.test(errMsg)) {
      try {
        item.photoFileId = null;
        item.photoUrl = null;
        await this.menu.save(item);
      } catch {
        /* игнор — не критично */
      }
    }
  }
}
