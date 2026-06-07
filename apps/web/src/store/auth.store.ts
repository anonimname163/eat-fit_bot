import { create } from 'zustand';
import { ClientDto } from '@/lib/types';

export type AuthStatus = 'idle' | 'loading' | 'authed' | 'no-telegram' | 'error';

interface AuthState {
  token: string | null;
  client: ClientDto | null;
  status: AuthStatus;
  error?: string;
  setAuth: (token: string, client: ClientDto) => void;
  setClient: (client: ClientDto) => void;
  setStatus: (status: AuthStatus, error?: string) => void;
}

/** Сессия Mini App: JWT + профиль клиента. Токен живёт в памяти (initData → JWT при старте). */
export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  client: null,
  status: 'idle',
  setAuth: (token, client) => set({ token, client, status: 'authed', error: undefined }),
  setClient: (client) => set({ client }),
  setStatus: (status, error) => set({ status, error }),
}));

/** Доступ к токену вне React (для api-клиента). */
export function getAuthToken(): string | null {
  return useAuthStore.getState().token;
}
