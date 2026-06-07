/**
 * Абстракция уведомлений (DIP): доменные сервисы зависят от INotifier, не от Telegram.
 * Конкретная реализация (Telegram) поставляется в эпике бота.
 */
export const NOTIFIER = Symbol('NOTIFIER');

export enum NotifyGroup {
  Cooks = 'cooks',
  Couriers = 'couriers',
  Admins = 'admins',
}

export interface INotifier {
  /** Сообщение конкретному пользователю по Telegram id. */
  notifyUser(telegramId: string, message: string): Promise<void>;
  /** Сообщение в рабочую группу (повара/курьеры/админы). */
  notifyGroup(group: NotifyGroup, message: string): Promise<void>;
}
