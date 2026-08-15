"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// Tuned against the connection stalls investigated on 2026-08-15. A stalled
// query fails at the server's timeout and a *fresh* attempt then succeeds in
// ~190ms, so nearly every failure a user hits is recoverable by simply asking
// again. React Query's defaults back off 1s/2s/4s, which is sensible for a
// genuinely overloaded server but far slower than needed here — this backs off
// 250ms/500ms/1s instead, so recovery usually lands within a single render and
// the user never learns anything went wrong.
//
// Mutations deliberately keep the default of no retries: replaying a POST that
// may already have been applied risks duplicate trades, posts and payments.
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 3,
        retryDelay: (attempt) => Math.min(250 * 2 ** attempt, 1_000),
        refetchOnWindowFocus: false,
      },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
