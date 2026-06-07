'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { initTelegram, applyTheme } from '@/lib/telegram';
import { bootstrapAuth } from '@/lib/auth';

/** Клиентские провайдеры: TanStack Query + инициализация Telegram/темы/авторизации. */
export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 10_000 },
        },
      }),
  );

  useEffect(() => {
    initTelegram();
    applyTheme();
    void bootstrapAuth();
  }, []);

  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}
