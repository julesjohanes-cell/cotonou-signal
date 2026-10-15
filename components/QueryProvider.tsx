"use client";
// Client TanStack Query unique pour toute l'app.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError } from "@/lib/api";

// On ne réessaie pas une erreur métier (4xx : refus, lien expiré…) ; on réessaie 2 fois une coupure réseau.
const reessayer = (tentatives: number, erreur: unknown) =>
  !(erreur instanceof ApiError && erreur.status >= 400 && erreur.status < 500) && tentatives < 2;

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 10_000, retry: reessayer },
          mutations: { retry: false },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
