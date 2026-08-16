"use client";

import { useQuery } from "@tanstack/react-query";
import type { Candle } from "@/components/ui";

export type CandlePeriod = "M15" | "M30" | "H1" | "H4" | "D1";

interface CandlesResponse {
  symbol: string;
  period: CandlePeriod;
  bars:   Candle[];
  cached: boolean;
}

/** Decimals the pair is quoted to — drives the price scale and the level labels. */
export function pricePrecision(pair: string): number {
  if (pair.endsWith("JPY")) return 3;
  if (pair === "XAUUSD") return 2;
  if (pair === "NAS100") return 1;
  return 5;
}

/**
 * Bars around a moment in time — a trade's entry, or an alert being posted.
 *
 * `centre` and the window are given in absolute terms rather than "last N
 * bars", because these charts are about a specific past event: a journal entry
 * from March needs March's price action, not today's.
 *
 * Closed bars never change, so a window that ended in the past is effectively
 * immutable and worth a long staleTime.
 */
export function useCandles(opts: {
  pair:    string;
  period:  CandlePeriod;
  from:    Date | null;
  to:      Date | null;
  enabled?: boolean;
}) {
  const { pair, period, from, to, enabled = true } = opts;
  const fromISO = from?.toISOString() ?? null;
  const toISO   = to?.toISOString() ?? null;

  return useQuery({
    queryKey: ["candles", pair, period, fromISO, toISO],
    enabled:  enabled && !!pair && !!fromISO && !!toISO,
    staleTime: 5 * 60_000,
    // A 404 means the broker does not offer this symbol, and a 400 means the
    // window is impossible — neither improves by asking again. Everything else
    // (a cold Durable Object, a dropped socket) usually clears on retry.
    retry: (count, err) => !(err instanceof CandlesFetchError && err.status < 500) && count < 3,
    queryFn: async (): Promise<Candle[]> => {
      const params = new URLSearchParams({ pair, period, from: fromISO!, to: toISO! });
      const res = await fetch(`/api/candles?${params}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new CandlesFetchError(res.status, body?.error ?? `Chart data unavailable (${res.status})`);
      }
      const data = (await res.json()) as CandlesResponse;
      return data.bars ?? [];
    },
  });
}

export class CandlesFetchError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "CandlesFetchError";
  }
}
