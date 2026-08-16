// Objective facts about what price actually did around a trade, derived from
// broker candles.
//
// Why this exists: Gavo grades against a 13-rule rulebook, but until now it
// only ever saw what the trader typed. Rules 3 (premium/discount), 4 (liquidity
// swept), 8 (stop placement) and 11 (killzone) are all claims about price, so
// the grade was really a reading of how confidently the note was written. This
// module supplies ground truth for the parts that can be measured.
//
// Deliberately does NOT try to detect FVGs or order blocks. Those need
// judgement about context and displacement, and a confidently wrong "no FVG
// present" would be worse than saying nothing — it would have Gavo correcting
// a trader who was right. What is here is arithmetic, not interpretation.

import type { Candle } from "@/components/ui";
import { PIP_SIZE } from "@/types/fx-orders";

export interface TradeFacts {
  pair:      string;
  dir:       "long" | "short";
  openedAt:  Date;
  closedAt?: Date | null;
  entry?:    number | null;
  stop?:     number | null;
  target?:   number | null;
}

/** One timeframe's bars. */
export interface Series {
  period: string;
  bars:   Candle[];
}

export interface PriceContext {
  entryPeriod: string;
  htfPeriod:   string;
  barCount:    number;
  killzone:    { entryUtc: string; window: string | null };
  htf:         { high: number; low: number; equilibrium: number; entrySide: string; pctOfRange: number; trend: string } | null;
  excursion:   { maePips: number; mfePips: number; maeR: number | null; mfeR: number | null } | null;
  stop:        { pips: number; atrPips: number; atrMultiple: number; wasHit: boolean } | null;
  target:      { pips: number; reached: boolean; reachedBeforeExit: boolean } | null;
  sweep:       { sweptPriorHigh: boolean; sweptPriorLow: boolean; lookbackBars: number };
}

// The S&D rulebook states these in UTC, so they are used verbatim rather than
// converting the SMC rulebook's EST windows and inheriting a DST bug.
const KILLZONES: Array<{ name: string; startMin: number; endMin: number }> = [
  { name: "London open (0800-1100 UTC)",   startMin: 8 * 60,          endMin: 11 * 60 },
  { name: "New York open (1330-1600 UTC)", startMin: 13 * 60 + 30,    endMin: 16 * 60 },
];

const ATR_BARS = 14;
const SWEEP_LOOKBACK = 20;

function pipSize(pair: string): number {
  return PIP_SIZE[pair] ?? (pair.endsWith("JPY") ? 0.01 : 0.0001);
}

function toPips(delta: number, pair: string): number {
  return Math.round((Math.abs(delta) / pipSize(pair)) * 10) / 10;
}

/** Average true range over the bars *before* entry — the volatility the trader was sizing against. */
function atr(candles: Candle[], endIndex: number): number | null {
  const start = Math.max(1, endIndex - ATR_BARS);
  if (endIndex - start < 3) return null;
  let sum = 0;
  let n = 0;
  for (let i = start; i < endIndex; i++) {
    const prevClose = candles[i - 1].c;
    sum += Math.max(
      candles[i].h - candles[i].l,
      Math.abs(candles[i].h - prevClose),
      Math.abs(candles[i].l - prevClose),
    );
    n++;
  }
  return n > 0 ? sum / n : null;
}

/**
 * Higher-timeframe trend, by a stated heuristic so Gavo can weigh it: are the
 * most recent swing high and low both above the previous pair (uptrend), both
 * below (downtrend), or neither (range)?
 */
function htfTrend(bars: Candle[]): string {
  if (bars.length < 12) return "not enough history to judge";
  const half = Math.floor(bars.length / 2);
  const older = bars.slice(0, half);
  const newer = bars.slice(half);
  const oHigh = Math.max(...older.map((c) => c.h));
  const oLow = Math.min(...older.map((c) => c.l));
  const nHigh = Math.max(...newer.map((c) => c.h));
  const nLow = Math.min(...newer.map((c) => c.l));
  if (nHigh > oHigh && nLow > oLow) return "higher highs and higher lows (bullish structure)";
  if (nHigh < oHigh && nLow < oLow) return "lower highs and lower lows (bearish structure)";
  return "no clean directional structure (ranging)";
}

export function buildPriceContext(
  series: { entry: Series; htf: Series },
  trade: TradeFacts,
): PriceContext | null {
  const candles = series.entry.bars;
  const period = series.entry.period;
  if (candles.length < 5) return null;

  const openedSec = Math.floor(trade.openedAt.getTime() / 1000);
  const entryIndex = candles.findLastIndex((c) => c.time <= openedSec);
  if (entryIndex < 0) return null;

  const closedSec = trade.closedAt ? Math.floor(trade.closedAt.getTime() / 1000) : null;
  const exitIndex = closedSec == null
    ? candles.length - 1
    : Math.max(entryIndex, candles.findLastIndex((c) => c.time <= closedSec));

  const pair = trade.pair;
  const isLong = trade.dir === "long";

  // ── Killzone ───────────────────────────────────────────────────────────────
  const minutesUtc = trade.openedAt.getUTCHours() * 60 + trade.openedAt.getUTCMinutes();
  const zone = KILLZONES.find((k) => minutesUtc >= k.startMin && minutesUtc < k.endMin);

  // ── Premium / discount, on the HIGHER timeframe range ──────────────────────
  // The rulebook says premium/discount of the *HTF* range, and it matters: a
  // trade can sit in discount on the entry timeframe and deep premium on the
  // daily, which is the opposite verdict. Measured on bars before entry only,
  // since using the trade's own outcome to judge its location is circular.
  const htfPre = series.htf.bars.filter((c) => c.time <= openedSec);
  let htf: PriceContext["htf"] = null;
  if (htfPre.length >= 5 && trade.entry != null) {
    const high = Math.max(...htfPre.map((c) => c.h));
    const low = Math.min(...htfPre.map((c) => c.l));
    const equilibrium = (high + low) / 2;
    const width = high - low;
    if (width > 0) {
      htf = {
        high, low, equilibrium,
        entrySide: trade.entry > equilibrium ? "premium" : trade.entry < equilibrium ? "discount" : "equilibrium",
        pctOfRange: Math.round(((trade.entry - low) / width) * 1000) / 10,
        trend: htfTrend(htfPre),
      };
    }
  }

  // ── Excursion while the trade was live ─────────────────────────────────────
  const live = candles.slice(entryIndex, exitIndex + 1);
  let excursion: PriceContext["excursion"] = null;
  if (live.length > 0 && trade.entry != null) {
    const worst = isLong ? Math.min(...live.map((c) => c.l)) : Math.max(...live.map((c) => c.h));
    const best = isLong ? Math.max(...live.map((c) => c.h)) : Math.min(...live.map((c) => c.l));
    const mae = isLong ? trade.entry - worst : worst - trade.entry;
    const mfe = isLong ? best - trade.entry : trade.entry - best;
    const r = trade.stop != null ? Math.abs(trade.entry - trade.stop) : null;
    excursion = {
      maePips: toPips(Math.max(mae, 0), pair),
      mfePips: toPips(Math.max(mfe, 0), pair),
      maeR: r && r > 0 ? Math.round((Math.max(mae, 0) / r) * 100) / 100 : null,
      mfeR: r && r > 0 ? Math.round((Math.max(mfe, 0) / r) * 100) / 100 : null,
    };
  }

  // ── Stop quality against the volatility at the time ────────────────────────
  let stop: PriceContext["stop"] = null;
  if (trade.entry != null && trade.stop != null) {
    const distance = Math.abs(trade.entry - trade.stop);
    const a = atr(candles, entryIndex);
    const hit = live.some((c) => (isLong ? c.l <= trade.stop! : c.h >= trade.stop!));
    stop = {
      pips: toPips(distance, pair),
      atrPips: a != null ? toPips(a, pair) : 0,
      atrMultiple: a && a > 0 ? Math.round((distance / a) * 100) / 100 : 0,
      wasHit: hit,
    };
  }

  // ── Target: reached at all, and reached before the trader exited ───────────
  let target: PriceContext["target"] = null;
  if (trade.entry != null && trade.target != null) {
    const after = candles.slice(entryIndex);
    const hitIn = (arr: Candle[]) =>
      arr.some((c) => (isLong ? c.h >= trade.target! : c.l <= trade.target!));
    target = {
      pips: toPips(trade.target - trade.entry, pair),
      reached: hitIn(after),
      reachedBeforeExit: hitIn(live),
    };
  }

  // ── Liquidity sweep, by a stated definition ────────────────────────────────
  // Named as a heuristic in the prompt so Gavo can weigh it accordingly: did
  // the three bars before entry exceed the prior 20-bar extreme and close back
  // inside it?
  const refStart = Math.max(0, entryIndex - SWEEP_LOOKBACK);
  const reference = candles.slice(refStart, Math.max(refStart + 1, entryIndex - 2));
  const recent = candles.slice(Math.max(0, entryIndex - 2), entryIndex + 1);
  let sweptPriorHigh = false;
  let sweptPriorLow = false;
  if (reference.length >= 3 && recent.length > 0) {
    const priorHigh = Math.max(...reference.map((c) => c.h));
    const priorLow = Math.min(...reference.map((c) => c.l));
    sweptPriorHigh = recent.some((c) => c.h > priorHigh && c.c < priorHigh);
    sweptPriorLow = recent.some((c) => c.l < priorLow && c.c > priorLow);
  }

  return {
    entryPeriod: period,
    htfPeriod:   series.htf.period,
    barCount:    candles.length,
    killzone: { entryUtc: trade.openedAt.toISOString().slice(11, 16) + " UTC", window: zone?.name ?? null },
    htf,
    excursion,
    stop,
    target,
    sweep: { sweptPriorHigh, sweptPriorLow, lookbackBars: SWEEP_LOOKBACK },
  };
}

/**
 * Entry timeframe chosen from how long the trade was held: a scalp read on H1
 * hides the entry entirely, and a multi-week swing read on M15 would need
 * thousands of bars to cover.
 */
export function entryPeriodFor(openedAt: Date, closedAt?: Date | null): "M15" | "H1" | "H4" {
  const heldMs = (closedAt ?? openedAt).getTime() - openedAt.getTime();
  if (heldMs <= 8 * 3_600_000) return "M15";
  if (heldMs <= 3 * 86_400_000) return "H1";
  return "H4";
}

/** Renders the context for the prompt. Plain lines, since models read these far better than JSON. */
export function formatPriceContext(ctx: PriceContext): string {
  const out: string[] = [
    "VERIFIED PRICE DATA (measured from broker candles, not the trader's account):",
    `Entry timeframe: ${ctx.barCount} ${ctx.entryPeriod} bars around the entry. Higher timeframe: ${ctx.htfPeriod}.`,
    `Entry time: ${ctx.killzone.entryUtc}. Killzone: ${ctx.killzone.window ?? "OUTSIDE any killzone window"}.`,
  ];

  if (ctx.htf) {
    out.push(
      `${ctx.htfPeriod} structure before entry: ${ctx.htf.trend}.`,
      `${ctx.htfPeriod} range before entry: ${ctx.htf.low} to ${ctx.htf.high}, equilibrium ${ctx.htf.equilibrium.toFixed(5)}. ` +
      `Entry sat in ${ctx.htf.entrySide} at ${ctx.htf.pctOfRange}% of that range.`,
    );
  }
  if (ctx.sweep.sweptPriorHigh || ctx.sweep.sweptPriorLow) {
    out.push(
      `Liquidity sweep (heuristic: price exceeded the prior ${ctx.sweep.lookbackBars}-bar ` +
      `${ctx.sweep.sweptPriorHigh ? "high" : "low"} in the 3 bars before entry, then closed back inside): DETECTED.`,
    );
  } else {
    out.push(`Liquidity sweep (same ${ctx.sweep.lookbackBars}-bar heuristic): not detected. This is a rough test, so treat it as weak evidence only.`);
  }
  if (ctx.stop) {
    out.push(
      `Stop distance: ${ctx.stop.pips} pips, which is ${ctx.stop.atrMultiple}x the ${ctx.stop.atrPips}-pip ATR at entry. ` +
      `Stop ${ctx.stop.wasHit ? "WAS hit" : "was never hit"} while the trade was open.`,
    );
  }
  if (ctx.excursion) {
    out.push(
      `Max adverse excursion: ${ctx.excursion.maePips} pips` +
      (ctx.excursion.maeR != null ? ` (${ctx.excursion.maeR}R of the risk)` : "") +
      `. Max favourable: ${ctx.excursion.mfePips} pips` +
      (ctx.excursion.mfeR != null ? ` (${ctx.excursion.mfeR}R)` : "") + ".",
    );
  }
  if (ctx.target) {
    out.push(
      `Target ${ctx.target.reachedBeforeExit ? "was reached before the trader exited" : ctx.target.reached ? "was NOT reached before exit, but price got there afterwards" : "was never reached in this window"}.`,
    );
  }

  out.push(
    "Use these facts to check the trader's account of the setup. Where the data contradicts the note, say so plainly and grade on the data. Where a rule cannot be checked from this (FVG and order block quality especially), judge it from the note as before and do not pretend to have verified it.",
  );
  return out.join("\n");
}
