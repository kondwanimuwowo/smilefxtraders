// Server-side read of the last known broker prices held by the SpotwareFeed
// Durable Object (src/durable-objects/SpotwareFeed.ts).
//
// This is the request/response counterpart to the WebSocket relay in
// app/api/prices/stream/route.ts: same object, same connection, but for
// callers that need a value once rather than a stream.
//
// Every failure mode returns an empty map rather than throwing, because every
// caller has a Twelve Data fallback and a broker hiccup must not take a page
// down. That includes local `next dev` without wrangler, where the Durable
// Object binding simply isn't present.

import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Ticks arrive several times a second while a market is open, so anything
 * older than this means the feed is down or the market is closed — in both
 * cases Twelve Data is the better answer.
 */
export const SPOT_MAX_AGE_MS = 15 * 60_000;

const SNAPSHOT_TIMEOUT_MS = 1_500;

interface SpotwareBinding {
  idFromName(name: string): unknown;
  get(id: unknown): { fetch(url: string, init?: RequestInit): Promise<Response> };
}

interface SnapshotResponse {
  prices:    Record<string, number>;
  at:        Record<string, number>;
  connected: boolean;
}

/**
 * Last broker price per symbol, keyed by the platform's display symbol
 * ("EURUSD", "XAUUSD"). Quotes older than `maxAgeMs` are dropped, so an empty
 * result means "no usable Spotware data" and never "prices are all zero".
 */
export async function getSpotwarePrices(maxAgeMs = SPOT_MAX_AGE_MS): Promise<Record<string, number>> {
  try {
    const ctx = getCloudflareContext() as unknown as { env: Record<string, unknown> };
    const binding = ctx.env.SPOTWARE_FEED as SpotwareBinding | undefined;
    if (!binding) return {};

    const stub = binding.get(binding.idFromName("default"));

    // The object answers from cache and never blocks on the broker, so this
    // should be sub-millisecond; the timeout only guards against the object
    // itself being wedged.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SNAPSHOT_TIMEOUT_MS);
    const res = await stub
      .fetch("https://spotware-feed/snapshot", { signal: controller.signal })
      .finally(() => clearTimeout(timer));

    if (!res.ok) return {};
    const data = (await res.json()) as SnapshotResponse;

    const now = new Date().getTime();
    const fresh: Record<string, number> = {};
    for (const [sym, price] of Object.entries(data.prices ?? {})) {
      const at = data.at?.[sym];
      if (typeof at !== "number" || now - at > maxAgeMs) continue;
      if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) continue;
      fresh[sym] = price;
    }
    return fresh;
  } catch {
    return {};
  }
}
