import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Category, Language, Role } from '@eatfit/shared';
import type { Context } from 'telegraf';
import { Client } from '../clients/entities/client.entity';
import { MenuItem } from '../menu/entities/menu-item.entity';
import { MenuRepository } from '../menu/menu.repository';
import { currentIsoWeekday } from '../common/time/weekday';
import { CartService } from '../orders/cart/cart.service';
import { BotStateService } from './bot-state.service';
import { Lang, t, categoryName, pick, formatMoney, esc } from './i18n/bot-i18n';
import { mainMenuKeyboard, stepperRow } from './telegram-keyboards';

/**
 * Презентационный слой бота. Витрина — карточки блюд (фото + степпер); количество правится
 * на месте (editMessageReplyMarkup), id всех сообщений запоминаются, чтобы удалить витрину
 * при оформлении («меню исчезает»). Конец витрины — кнопка «Оформить заказ».
 */
@Injectable()
export class BotUiService {
  private readonly logger = new Logger(BotUiService.name);
  private readonly adminIds: string[];
  private readonly webAppUrl?: string;
  private readonly tzOffsetHours: number;

  constructor(
    private readonly config: ConfigService,
    private readonly menu: MenuRepository,
    private readonly cart: CartService,
    private readonly state: BotStateService,
  ) {
    this.adminIds = this.config.get<string[]>('telegram.adminIds') ?? [];
    this.webAppUrl = this.config.get<string>('bot.webAppUrl');
    this.tzOffsetHours = this.config.get<number>('reports.tzOffsetHours') ?? 5;
  }

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

  private async cartQuantities(): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    try {
      const cart = await this.cart.getCart();
      for (const it of cart.items) map.set(it.menuItemId, it.quantity);
    } catch {
      /* actor не установлен — 0 */
    }
    return map;
  }

  /** Витрина: карточки с фото и степпером + кнопка оформления. Запоминает id сообщений. */
  async renderMenu(ctx: Context, client: Client): Promise<void> {
    const lang = this.langOf(client);
    // Витрина бота — только блюда на сегодняшний день недели (как и на сайте).
    const items = await this.menu.findActive(undefined, currentIsoWeekday(this.tzOffsetHours));
    if (!items.length) {
      await ctx.reply(t(lang, 'menu_empty'));
      return;
    }
    const ids: number[] = [];
    const title = await ctx.reply(`🍽 <b>${esc(t(lang, 'menu_title'))}</b>`, { parse_mode: 'HTML' });
    ids.push(title.message_id);

    const quantities = await this.cartQuantities();
    const categories: Category[] = [Category.Main, Category.Drink, Category.Dessert];
    for (const cat of categories) {
      const catItems = items.filter((i) => i.category === cat);
      if (!catItems.length) continue;
      const head = await ctx.reply(`<b>${esc(categoryName(lang, cat))}</b>`, { parse_mode: 'HTML' });
      ids.push(head.message_id);
      for (const item of catItems) {
        const id = await this.sendDishCard(ctx, lang, item, quantities.get(item.id) ?? 0);
        if (id) ids.push(id);
      }
    }
    const prompt = await ctx.reply(t(lang, 'checkout_prompt'), {
      reply_markup: { inline_keyboard: [[{ text: t(lang, 'btn_checkout'), callback_data: 'cart:checkout' }]] },
    });
    ids.push(prompt.message_id);

    if (client.telegramId) this.state.setMenuMessages(client.telegramId, ids);
  }

  /** Карточка блюда: фото (file_id/url) или текст + ряд-степпер. Возвращает message_id. */
  async sendDishCard(ctx: Context, lang: Lang, item: MenuItem, qty: number): Promise<number | undefined> {
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
        const msg = await ctx.replyWithPhoto(photo, { caption: text, parse_mode: 'HTML', ...markup });
        return msg.message_id;
      } catch (err) {
        this.logger.warn(`sendPhoto блюдо ${item.id}: ${(err as Error).message}`);
        await this.clearInvalidPhoto(item, (err as Error).message);
      }
    }
    const msg = await ctx.reply(text, { parse_mode: 'HTML', ...markup });
    return msg.message_id;
  }

  /** Удалить сообщения витрины (карточки + промпт) — при оформлении меню «исчезает». */
  async deleteMenu(ctx: Context, telegramId: string): Promise<void> {
    const ids = this.state.getMenuMessages(telegramId);
    const chatId = ctx.chat?.id;
    if (chatId) {
      for (const id of ids) {
        try {
          await ctx.telegram.deleteMessage(chatId, id);
        } catch {
          /* старше 48ч / уже удалено — игнор */
        }
      }
    }
    this.state.clearMenuMessages(telegramId);
  }

  /** Сбрасываем битый file_id/url, чтобы ошибка не повторялась. */
  private async clearInvalidPhoto(item: MenuItem, errMsg: string): Promise<void> {
    if (/wrong file identifier|HTTP URL|PHOTO_INVALID|wrong remote file|file_id/i.test(errMsg)) {
      try {
        item.photoFileId = null;
        item.photoUrl = null;
        await this.menu.save(item);
      } catch {
        /* не критично */
      }
    }
  }
}
