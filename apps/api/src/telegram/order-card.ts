import { Markup } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { OrderStatus, Role } from '@eatfit/shared';
import { OrderResponseDto } from '../orders/dto/order-response.dto';
import { allowedTargets } from '../orders/order-status.machine';
import { Lang, t, esc, pick, formatMoney, statusText } from './i18n/bot-i18n';

/**
 * Чистые билдеры карточки заказа и кнопок переходов (без зависимостей от сервисов) —
 * общий источник для панелей персонала (BotStaffService) и уведомлений в группы
 * (TelegramNotifier). Кнопки строятся из FSM allowedTargets(status, role): UI и домен
 * из одного места, а права при нажатии всё равно проверяет OrdersService.transition.
 */

/** Карточка заказа для персонала: позиции, адрес, сумма, комментарий. */
export function orderCardText(lang: Lang, order: OrderResponseDto): string {
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
export function orderActionButtons(
  lang: Lang,
  order: OrderResponseDto,
  role: Role,
): InlineKeyboardButton[] {
  return allowedTargets(order.status, role).map((target) => {
    const label =
      target === OrderStatus.Cancelled
        ? t(lang, 'btn_cancel_order')
        : `▶️ ${statusText(lang, target)}`;
    return Markup.button.callback(label, `ord:set:${order.id}:${target}`);
  });
}

/** Клавиатура переходов (одна строка кнопок). */
export function orderActionKeyboard(lang: Lang, order: OrderResponseDto, role: Role) {
  return Markup.inlineKeyboard([orderActionButtons(lang, order, role)]);
}
