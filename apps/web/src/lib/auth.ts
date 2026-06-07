import { api } from './api';
import { getInitData } from './telegram';
import { useAuthStore } from '@/store/auth.store';
import { AuthResponse } from './types';

/**
 * Старт сессии: initData (подписанная Telegram) → JWT через /api/auth/telegram.
 * Вне Telegram (нет initData) — статус no-telegram (показываем «Открыть в Telegram»).
 */
export async function bootstrapAuth(): Promise<void> {
  const store = useAuthStore.getState();
  const initData = getInitData();
  if (!initData) {
    store.setStatus('no-telegram');
    return;
  }
  store.setStatus('loading');
  try {
    const res = await api<AuthResponse>('/auth/telegram', {
      method: 'POST',
      body: { initData },
      token: '',
    });
    store.setAuth(res.accessToken, res.client);
  } catch (e) {
    store.setStatus('error', (e as Error).message);
  }
}
