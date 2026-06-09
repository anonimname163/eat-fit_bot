import { Markup } from 'telegraf';
import { MenuItem } from '../menu/entities/menu-item.entity';
import { Lang, t, esc, formatMoney } from './i18n/bot-i18n';

/**
 * Пост блюда для канала — общий источник для бота (StaffUpdate) и публикации с сайта
 * (MenuPublishService). Текст двуязычный (ru + uz), под постом — deep-link «Заказать».
 */

/** Двуязычный текст поста блюда (канал публичный для обеих аудиторий). */
export function channelPostText(item: MenuItem): string {
  const nameRu = item.nameRu?.trim();
  const nameUz = item.nameUz?.trim();
  const nameLine =
    nameRu && nameUz && nameRu !== nameUz ? `${nameRu} / ${nameUz}` : nameRu || nameUz || '';

  // В посте/боте — только название и цена (описание показывается лишь в Mini App).
  const lines = [`🍽 <b>${esc(nameLine)}</b>`];
  lines.push(`💵 ${esc(formatMoney(item.price.toString()))} сум / so‘m`);
  return lines.join('\n');
}

/** Inline-кнопка «Заказать» с deep link (если задан BOT_USERNAME) — запуск + добавление в корзину. */
export function orderDeepLinkButton(item: MenuItem, lang: Lang, botUsername?: string) {
  if (!botUsername) return {};
  const url = `https://t.me/${botUsername}?start=item_${item.id}`;
  return Markup.inlineKeyboard([[Markup.button.url(t(lang, 'post_order_btn'), url)]]);
}

/** Фото для поста: загруженный файл недоступен боту по URL → отдаём file_id/внешний URL, иначе null. */
export function channelPostPhoto(item: MenuItem): string | null {
  return item.photoFileId || item.photoUrl || null;
}
