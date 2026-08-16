// Server-side read of historical candles from the SpotwareFeed Durable Object
// (src/durable-objects/SpotwareFeed.ts).
//
// Sibling of snapshot.ts, and deliberately unlike it in one respect: that one
// swallows every failure into an empty map because each caller has a Twelve
// Data fallback. There is no fallback for candles. An empty bar array renders
// as a blank chart, which is indistinguishable from a quiet market — so
// failures are surfaced, and the caller decides what to show.

import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { TrendbarPeriod, Trendbar } from "@/lib/spotware/messages";

/** A cold object pays TCP + TLS + app auth + account auth + symbols list before it can answer. */
const CANDLES_TIMEOUT_MS = 15_000;

interface SpotwareBinding {
  idFromName(name: string): unknown;
  get(id: unknown): { fetch(url: string, init?: RequestInit): Promise<Response> };
}

export interface CandlesResult {
  symbol:  string;
  period:  TrendbarPeriod;
  bars:    Trendbar[];
  hasMore: boolean;
  cached:  boolean;
}

/** Thrown with the status the API route should pass through, so a 404 for an unknown symbol stays a 404. */
export class CandlesError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "CandlesError";
  }
}

export async function getCandles(opts: {
  symbol: string;
  period: TrendbarPeriod;
  from:   Date;
  to:     Date;
  count?: number;
}): Promise<CandlesResult> {
  let binding: SpotwareBinding | undefined;
  try {
    const ctx = getCloudflareContext() as unknown as { env: Record<string, unknown> };
    binding = ctx.env.SPOTWARE_FEED as SpotwareBinding | undefined;
  } catch {
    binding = undefined;
  }
  // Absent in `next dev` without wrangler. 503 rather than a fabricated empty
  // series — the whole point of this work is that charts stop making things up.
  if (!binding) throw new CandlesError(503, "Broker feed is not available");

  const stub = binding.get(binding.idFromName("default"));
  const url = new URL("https://spotware-feed/trendbars");
  url.searchParams.set("symbol", opts.symbol);
  url.searchParams.set("period", opts.period);
  url.searchParams.set("from", String(opts.from.getTime()));
  url.searchParams.set("to", String(opts.to.getTime()));
  if (opts.count != null) url.searchParams.set("count", String(opts.count));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CANDLES_TIMEOUT_MS);

  let res: Response;
  try {
    res = await stub.fetch(url.toString(), { signal: controller.signal });
  } catch {
    throw new CandlesError(504, "Timed out loading candles");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new CandlesError(res.status, body?.error ?? "Could not load candles");
  }

  return (await res.json()) as CandlesResult;
}
