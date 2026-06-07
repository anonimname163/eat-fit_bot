import { Injectable } from '@nestjs/common';
import { Markup } from 'telegraf';
import type { Context } from 'telegraf';
import { OrderStatus, Role } from '@eatfit/shared';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { Client } from '../clients/entities/client.entity';
import { OrdersService } from '../orders/orders.service';
import { OrderResponseDto } from '../orders/dto/order-response.dto';
import { allowedTargets } from '../orders/order-status.machine';
import { Lang, t, esc, pick, formatMoney, statusText } from './i18n/bot-i18n';

/**
 * Интерфейсы персонала (FR-B3): панели повара/курьера/админа со списком заказов и кнопками
 * перехода статуса. Кнопки строятся из FSM allowedTargets(status, role) — UI и домен из
 * одного источника. Сама смена идёт через OrdersService.transition (assertTransition +
 * возврат денег + нотификация клиенту), поэтому callback_data не источник прав (AR-9 P0).
 */
@Injectable()
export class BotStaffService {
  constructor(private readonly orders: OrdersService) {}

  private langOf(client: Client): Lang {
    return client.language;
  }

  async showCookPanel(ctx: Context, client: Client): Promise<void> {
    await this.renderOrders(
      ctx,
      client,
      [OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Cooking],
      'cook_panel_title',
      'cook_no_orders',
    );
  }

  async showCourierPanel(ctx: Context, client: Client): Promise<void> {
    await this.renderOrders(
      ctx,
      client,
      [OrderStatus.Cooking, OrderStatus.Delivering],
      'courier_panel_title',
      'courier_no_orders',
    );
  }

  async showAdminOrders(ctx: Context, client: Client): Promise<void> {
    const lang = this.langOf(client);
    await ctx.reply(
      t(lang, 'admin_panel_title'),
      Markup.inlineKeyboard([
        [
          Markup.button.callback(t(lang, 'admin_report'), 'admin:report'),
          Markup.button.callback(t(lang, 'admin_settings'), 'admin:settings'),
        ],
        [
          Markup.button.callback(t(lang, 'deposit_add'), 'admin:deposit'),
          Markup.button.callback(t(lang, 'admin_gen_post'), 'admin:post'),
        ],
      ]),
    );
    await this.renderOrders(
      ctx,
      client,
      [OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Cooking, OrderStatus.Delivering],
      'admin_orders',
      'cook_no_orders',
    );
  }

  /** Список заказов нужных статусов с кнопками переходов под каждым. */
  private async renderOrders(
    ctx: Context,
    client: Client,
    statuses: OrderStatus[],
    titleKey: 'cook_panel_title' | 'courier_panel_title' | 'admin_orders',
    emptyKey: 'cook_no_orders' | 'courier_no_orders',
  ): Promise<void> {
    const lang = this.langOf(client);
    const all = await this.orders.listAll();
    const list = all.filter((o) => statuses.includes(o.status));

    await ctx.reply(t(lang, titleKey));
    if (!list.length) {
      await ctx.reply(t(lang, emptyKey));
      return;
    }
    for (const order of list) {
      await ctx.reply(this.orderText(lang, order), {
        parse_mode: 'HTML',
        ...this.actionKeyboard(lang, order, client.role),
      });
    }
  }

  /** Карточка заказа для персонала: позиции, адрес, сумма, комментарий. */
  orderText(lang: Lang, order: OrderResponseDto): string {
    const num = order.id.slice(0, 8);
    const lines = [
      `<b>${esc(t(lang, 'order_label'))} #${esc(num)}</b> — ${esc(statusText(lang, order.status))}`,
    ];
    for (const it of order.items) {
      lines.push(`• ${esc(pick(lang, it.nameRu, it.nameUz))} ×${it.quantity}`);
    }
    lines.push(`${esc(t(lang, 'group_address'))}: ${esc(order.address)}`);
    lines.push(`💵 ${esc(formatMoney(order.total))} ${esc(t(lang, 'currency'))}`);
    if (order.comment) lines.push(`${esc(t(lang, 'group_comment'))}: ${esc(order.comment)}`);
    return lines.join('\n');
  }

  /** Кнопки переходов из текущего статуса для роли актора. */
  actionKeyboard(lang: Lang, order: OrderResponseDto, role: Role) {
    return Markup.inlineKeyboard([this.actionButtons(lang, order, role)]);
  }

  actionButtons(lang: Lang, order: OrderResponseDto, role: Role): InlineKeyboardButton[] {
    return allowedTargets(order.status, role).map((target) => {
      const label =
        target === OrderStatus.Cancelled
          ? t(lang, 'btn_cancel_order')
          : `▶️ ${statusText(lang, target)}`;
      return Markup.button.callback(label, `ord:set:${order.id}:${target}`);
    });
  }
}
