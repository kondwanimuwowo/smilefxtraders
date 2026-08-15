import { getInstruments } from "@/lib/server/getInstruments";
import { prisma } from "@/lib/prisma";
import { checkPaidPlan } from "@/lib/plan-guard";
import { computeCotStats, EMPTY_COT_STATS, INDEX_WEEKS, percentile } from "@/lib/cot/signal";
import { deriveMetaMap } from "@/lib/pairs";
import { computeCrossPairSignal } from "@/lib/cot/crossPairSignal";
import type { CotEntry, CotWeek } from "@/lib/cot/types";

// ── COT overview data ────────────────────────────────────────────────────────
//
// Server-only. Moved out of app/api/cot/route.ts so (app)/cot/page.tsx can
// prefetch it directly instead of the Worker fetching its own API over HTTP.
//
// `locked` is part of the result rather than a thrown 403 because the client
// treats it the same way: "FREE plan" is a settled answer, not a failure, and
// modelling it as an error makes every layer retry a decision that cannot
// change.
export interface CotOverviewResult {
  locked:  boolean;
  entries: CotEntry[];
}

export async function loadCotOverview(): Promise<CotOverviewResult> {
  // Plan gate — COT data requires a paid plan. Expressed as a result rather
  // than an HTTP response so the page's server prefetch can render the lock
  // screen without asking its own API over the network.
  const access = await checkPaidPlan();
  if (!access.allowed) return { locked: true, entries: [] };

  // Load instrument metadata from DB
  const instruments = await getInstruments();
  const cotInstruments = instruments
    .filter((i) => i.cotContract != null)
    .map((i) => ({
      pair:    i.symbol,
      label:   i.label,
      usdBase: i.cotInverted,
      fallback: {
        min:  i.cotMin52w  ?? 0,
        max:  i.cotMax52w  ?? 0,
        minC: i.cotMinC52w ?? 0,
        maxC: i.cotMaxC52w ?? 0,
      },
    }));

  const cotPairs = cotInstruments.map((inst) => inst.pair);

  // Was one findMany PER instrument (10+ separate round trips fired
  // concurrently on every /cot load — see 2026-08-14 incident). CFTC
  // publishes all contracts for the same weekly reportDate together, so a
  // single query filtered to the last ~INDEX_WEEKS+buffer of calendar time
  // covers every pair's window at once; group + slice to INDEX_WEEKS per
  // pair in JS below instead of a per-pair `take` at the DB level.
  const indexWindowCutoff = new Date();
  indexWindowCutoff.setDate(indexWindowCutoff.getDate() - (INDEX_WEEKS + 4) * 7);

  const [allRows, totals] = await Promise.all([
    prisma.cotReport.findMany({
      where:   { pair: { in: cotPairs }, reportDate: { gte: indexWindowCutoff } },
      orderBy: { reportDate: "desc" },
      select:  {
        pair:          true,
        reportDate:    true,
        largeSpecNet:  true, largeSpecLong: true, largeSpecShort: true,
        commercialNet: true, smallSpecNet:  true, openInterest:   true,
      },
    }),
    // One groupBy for totals + full-history net range (all-time index)
    prisma.cotReport.groupBy({
      by:     ["pair"],
      _count: { pair: true },
      _min:   { largeSpecNet: true },
      _max:   { largeSpecNet: true },
    }),
  ]);

  // allRows is globally sorted newest-first, so grouping by pair while
  // iterating preserves each pair's own newest-first order for free.
  const rowsByPair = new Map<string, typeof allRows>();
  for (const row of allRows) {
    const bucket = rowsByPair.get(row.pair);
    if (bucket) bucket.push(row);
    else rowsByPair.set(row.pair, [row]);
  }

  const totalByPair = new Map(totals.map((t) => [t.pair, t._count.pair]));
  const rangeByPair = new Map(totals.map((t) => [t.pair, { min: t._min.largeSpecNet, max: t._max.largeSpecNet }]));

  const entries: CotEntry[] = cotInstruments.map((inst) => {
    const rows = (rowsByPair.get(inst.pair) ?? []).slice(0, INDEX_WEEKS);
    const totalWeeks = totalByPair.get(inst.pair) ?? rows.length;

    if (rows.length >= 2) {
      const window: CotWeek[] = rows.map((r) => ({
        date:           r.reportDate.toISOString().split("T")[0],
        largeSpecNet:   r.largeSpecNet,
        commercialNet:  r.commercialNet,
        smallSpecNet:   r.smallSpecNet,
        largeSpecLong:  r.largeSpecLong,
        largeSpecShort: r.largeSpecShort,
      }));
      const stats = computeCotStats(window, inst.fallback);

      // 1-year index over the most recent 52 weeks of the fetched window
      const win52 = window.slice(0, 52).map((w) => w.largeSpecNet);
      const cotIndex52w = win52.length >= 52
        ? percentile(win52[0], Math.min(...win52), Math.max(...win52))
        : null;

      // All-time index from the groupBy's full-history range
      const range = rangeByPair.get(inst.pair);
      const cotIndexAll = range?.min != null && range?.max != null
        ? percentile(window[0].largeSpecNet, range.min, range.max)
        : null;

      return {
        pair:         inst.pair,
        label:        inst.label,
        usdBase:      inst.usdBase,
        history:      window.slice(0, 8),
        totalWeeks,
        openInterest: rows[0].openInterest,
        cotIndex52w,
        cotIndexAll,
        ...stats,
      };
    }

    // DB is empty for this instrument
    return {
      pair:         inst.pair,
      label:        inst.label,
      usdBase:      inst.usdBase,
      history:      [],
      totalWeeks:   0,
      openInterest: null,
      cotIndex52w:  null,
      cotIndexAll:  null,
      ...EMPTY_COT_STATS,
    };
  });

  // Cross pairs (minors) — no direct CFTC contract, so COT is derived from
  // each leg's currency-level positioning (see lib/cot/crossPairSignal.ts).
  const crossInstruments = instruments.filter((i) => i.category === "forex" && i.cotContract == null);
  const metaMap = deriveMetaMap(instruments);

  const crossEntriesRaw = await Promise.all(
    crossInstruments.map(async (inst): Promise<CotEntry | null> => {
      const meta = metaMap[inst.symbol];
      if (!meta) return null;
      const result = await computeCrossPairSignal(meta.base, meta.quote);
      if (!result) return null;
      const { stats, history, totalWeeks } = result;
      return {
        pair:         inst.symbol,
        label:        inst.label,
        usdBase:      false,
        history,
        totalWeeks,
        openInterest: null,
        cotIndex52w:  null,
        cotIndexAll:  null,
        synthetic:    true,
        ...stats,
      };
    })
  );
  const crossEntries = crossEntriesRaw.filter((e): e is CotEntry => e !== null);

  return { locked: false, entries: [...entries, ...crossEntries] };
}
