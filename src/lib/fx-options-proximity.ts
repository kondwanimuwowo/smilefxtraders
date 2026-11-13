import { prisma } from "@/lib/prisma";
import { getSpotwarePrices } from "@/lib/spotware/snapshot";
import { PIP_SIZE, type FxLevel } from "@/types/fx-orders";

// How close and how big a strike must be before it is worth a trader's
// attention. A strike only pulls price through dealer hedging as spot nears
// it ahead of the cut; far-off or small strikes are context, not signal.
const IN_PLAY_PIPS = 30;
// In the strike's own currency (€, $, £...). Close enough for a size cut-off.
const IN_PLAY_MIN_NOTIONAL_M = 1_000;
/** NY cut is 10:00 New York; 15:00 UTC is the winter time and the later of the two. */
const NY_CUT_UTC_HOUR = 15;

export interface OptionStrike {
  price:        number;
  notionalM:    number;
  label:        string; // "$1.5bn"
  distancePips: number; // signed: positive = strike above spot
  inPlay:       boolean;
}

export interface FxOptionsProximity {
  expiryDate: string; // YYYY-MM-DD
  spot:       number;
  strikes:    OptionStrike[]; // nearest first
  inPlay:     OptionStrike[];
}

function notionalM(l: FxLevel): number {
  const n = Number.parseFloat(l.notional);
  return Number.isFinite(n) ? (l.unit === "bn" ? n * 1_000 : n) : 0;
}

/**
 * The next expiry that has not been cut yet, measured against live spot.
 * Null when there is no upcoming expiry for the pair or no usable spot.
 */
export async function getFxOptionsProximity(pair: string, now = new Date()): Promise<FxOptionsProximity | null> {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const firstOpen = now.getUTCHours() >= NY_CUT_UTC_HOUR ? new Date(today.getTime() + 86_400_000) : today;

  const row = await prisma.fxOptionExpiry.findFirst({
    where:   { pair, expiryDate: { gte: firstOpen } },
    orderBy: { expiryDate: "asc" },
  });
  if (!row) return null;

  const live = (await getSpotwarePrices())[pair];
  const spot = live ?? (row.spotPrice ? Number.parseFloat(row.spotPrice) : NaN);
  if (!Number.isFinite(spot)) return null;

  const pip = PIP_SIZE[pair] ?? (pair.endsWith("JPY") ? 0.01 : 0.0001);
  const strikes = (row.levels as unknown as FxLevel[])
    .map((l): OptionStrike | null => {
      const price = Number.parseFloat(l.price);
      if (!Number.isFinite(price)) return null;
      const m = notionalM(l);
      const distancePips = Math.round((price - spot) / pip);
      return {
        price,
        notionalM: m,
        label: `${l.currency}${l.notional}${l.unit}`,
        distancePips,
        inPlay: Math.abs(distancePips) <= IN_PLAY_PIPS && (m >= IN_PLAY_MIN_NOTIONAL_M || l.large),
      };
    })
    .filter((s): s is OptionStrike => s !== null)
    .sort((a, b) => Math.abs(a.distancePips) - Math.abs(b.distancePips));

  return {
    expiryDate: row.expiryDate.toISOString().slice(0, 10),
    spot,
    strikes,
    inPlay: strikes.filter((s) => s.inPlay),
  };
}
