import { create } from 'zustand';

export type Tab = 'menu' | 'cart' | 'orders' | 'profile' | 'admin';

interface UiState {
  tab: Tab;
  setTab: (tab: Tab) => void;
}

/** Активная вкладка Mini App (клиентский роутинг без next-router). */
export const useUiStore = create<UiState>((set) => ({
  tab: 'menu',
  setTab: (tab) => set({ tab }),
}));
