/**
 * Доступ к Telegram WebApp SDK (window.Telegram.WebApp) и темизация.
 * Скрипт telegram-web-app.js подключён в layout. Вне Telegram WebApp == null.
 */
export interface TelegramWebApp {
  initData: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  ready(): void;
  expand(): void;
  openTelegramLink(url: string): void;
  onEvent(event: string, cb: () => void): void;
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

export function getWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

export function getInitData(): string {
  return getWebApp()?.initData ?? '';
}

/** Запущены ли мы внутри Telegram (есть подписанная initData). */
export function isTelegram(): boolean {
  return getInitData().length > 0;
}

export function initTelegram(): void {
  const wa = getWebApp();
  if (!wa) return;
  wa.ready();
  wa.expand();
  wa.onEvent('themeChanged', applyTheme);
}

/** Применить тему: data-theme на <html> + проброс themeParams в CSS-переменные. */
export function applyTheme(): void {
  if (typeof document === 'undefined') return;
  const wa = getWebApp();
  const scheme =
    wa?.colorScheme ??
    (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = scheme;

  const tp = wa?.themeParams ?? {};
  for (const [k, v] of Object.entries(tp)) {
    document.documentElement.style.setProperty(`--tg-theme-${k.replace(/_/g, '-')}`, v);
  }
}

export function openTelegram(url: string): void {
  getWebApp()?.openTelegramLink(url);
}
