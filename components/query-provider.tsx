// components/query-provider.tsx
"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Define um tempo padrão para os dados em cache se tornarem "stale" (desatualizados)
        staleTime: 1000 * 60 * 5, // 5 minutos
        // Tenta novamente a busca em caso de falha até 3 vezes
        retry: 3,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}