"use client";

import { useMemo } from "react";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { CotSignal } from "@/lib/cot/types";

// Minimal row type — satisfied by both CotWeek and CotDetailRow
type CotRow = { largeSpecNet: number; date: string };

interface CotIndexDisplayProps {
  rows:         CotRow[];
  cotIndex:     number;        // primary API index — 3yr/156w window
  cotIndexAll?: number | null; // server-computed percentile over the FULL stored history
  signal:       CotSignal;
  pair:         string;
  totalWeeks:   number;
  compact?:     boolean;       // true = ring-only mode for cards
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeIndex(rows: CotRow[], n: number): number {
  const slice = rows.slice(0, Math.min(n, rows.length));
  if (slice.length < 2) return 50;
  const nets  = slice.map((r) => r.largeSpecNet);
  const min   = Math.min(...nets);
  const max   = Math.max(...nets);
  const range = max - min || 1;
  return Math.round(Math.max(0, Math.min(100, ((rows[0].largeSpecNet - min) / range) * 100)));
}

function fmtNet(n: number): string {
  const abs  = Math.abs(n);
  const sign = n >= 0 ? "+" : "−";
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${sign}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${abs}`;
}

function fmtDate(iso: string): string {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short", year: "numeric",
  });
}

interface IdxCls {
  textCls:         string;
  barBgCls:        string;
  markerBorderCls: string;
  badgeBgCls:      string;
  badgeTextCls:    string;
  badgeBorderCls:  string;
}

const IDX_CLS: Record<"coralBright" | "coral" | "tealBright" | "teal" | "gold", IdxCls> = {
  coralBright: { textCls: "text-coral-bright", barBgCls: "bg-coral-bright", markerBorderCls: "border-coral-bright", badgeBgCls: "bg-[rgba(255,89,66,0.12)]",  badgeTextCls: "text-coral-bright", badgeBorderCls: "border-[rgba(255,89,66,0.12)]"  },
  coral:       { textCls: "text-coral",        barBgCls: "bg-coral",        markerBorderCls: "border-coral",        badgeBgCls: "bg-[rgba(234,82,61,0.10)]",  badgeTextCls: "text-coral",        badgeBorderCls: "border-[rgba(234,82,61,0.10)]"  },
  tealBright:  { textCls: "text-teal-bright",  barBgCls: "bg-teal-bright",  markerBorderCls: "border-teal-bright",  badgeBgCls: "bg-[rgba(48,232,223,0.12)]", badgeTextCls: "text-teal-bright",  badgeBorderCls: "border-[rgba(48,232,223,0.12)]" },
  teal:        { textCls: "text-teal",         barBgCls: "bg-teal",         markerBorderCls: "border-teal",         badgeBgCls: "bg-[rgba(8,174,170,0.10)]",  badgeTextCls: "text-teal",         badgeBorderCls: "border-[rgba(8,174,170,0.10)]"  },
  gold:        { textCls: "text-gold",         barBgCls: "bg-gold",         markerBorderCls: "border-gold",         badgeBgCls: "bg-[rgba(248,185,61,0.10)]", badgeTextCls: "text-gold",         badgeBorderCls: "border-[rgba(248,185,61,0.10)]" },
};

function indexCls(idx: number): IdxCls {
  if (idx <= 20) return IDX_CLS.coralBright;
  if (idx <= 35) return IDX_CLS.coral;
  if (idx >= 80) return IDX_CLS.tealBright;
  if (idx >= 65) return IDX_CLS.teal;
  return IDX_CLS.gold;
}

function indexZoneLabel(idx: number): string {
  if (idx >= 80) return "Extreme long zone";
  if (idx >= 65) return "Elevated";
  if (idx >= 45) return "Above midpoint";
  if (idx >= 35) return "Below midpoint";
  if (idx >= 20) return "Near cycle low";
  return "Cycle extreme low";
}

function interpretation(index3yr: number, index52w: number, signal: CotSignal, pair: string): string {
  const allLow  = index3yr < 20 && index52w < 20;
  const allHigh = index3yr > 80 && index52w > 80;
  const diverge = Math.abs(index3yr - index52w) > 25;

  if (allLow && (signal === "bear" || signal === "strong_bear"))
    return `Positioning near a multi-year extreme low: large specs have aggressively unwound ${pair} longs. Historically precedes either a sustained reversal or continued liquidation. Watch for WoW Δ to turn positive as first confirmation.`;
  if (allLow && signal === "neutral")
    return `Large specs are at historically low positioning but trimming has slowed. Accumulation may be beginning, but the COT Index needs to recover above 30 before calling a structural shift.`;
  if (allHigh && (signal === "bull" || signal === "strong_bull"))
    return `Positioning near a multi-year extreme high: large specs are maximally long ${pair}. Watch for exhaustion: if price fails to make new highs while COT Index stalls, distribution may be underway.`;
  if (diverge && index52w < 20 && index3yr > 40)
    return `Low on a 1-year basis but moderate on a 3-year view: a recent pullback within a longer bullish structure, not a structural extreme.`;
  if (diverge && index52w > 80 && index3yr < 50)
    return `High on a 1-year basis but below the 3-year midpoint: specs have recovered from a deeper trough. Momentum improving but structure is not yet bullish on the longer view.`;
  return `Positioning is in the middle of its historical range. No extreme signal, so COT is not the primary edge here. Focus on price structure and liquidity.`;
}

// ── Range track ───────────────────────────────────────────────────────────────

function RangeTrack({ value, label, weeks, cls }: { value: number; label: string; weeks: string; cls: IdxCls }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-ink-mid">{label}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-panel-2 text-ink-dim">
            {weeks}
          </span>
        </div>
        <span className={cn("text-[13px] font-bold tabular-nums", cls.textCls)}>
          {value}
          <span className="text-[10px] font-normal ml-0.5 text-ink-dim">/100</span>
        </span>
      </div>
      <div className="relative rounded-full overflow-hidden h-1.5 bg-track">
        <div className="absolute top-0 left-0 h-full w-1/5 bg-[rgba(234,82,61,0.15)]" />
        <div className="absolute top-0 right-0 h-full w-1/5 bg-[rgba(8,174,170,0.15)]" />
        <div
          className={cn("absolute top-0 left-0 h-full rounded-full opacity-45 transition-[width] duration-700 ease-app", cls.barBgCls)}
          style={{ width: `${value}%` }}
        />
        <div
          className={cn("absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 w-3 h-3 bg-panel transition-[left] duration-700 ease-app", cls.markerBorderCls)}
          style={{ left: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CotIndexDisplay({ rows, cotIndex, cotIndexAll, signal, pair, totalWeeks, compact = false }: CotIndexDisplayProps) {
  const index52w    = useMemo(() => computeIndex(rows, 52),          [rows]);
  const indexApprox = useMemo(() => computeIndex(rows, rows.length), [rows]);

  const { peakNet, peakDate, troughNet, troughDate } = useMemo(() => {
    let peak = rows[0]; let trough = rows[0];
    for (const r of rows) {
      if (r.largeSpecNet > peak.largeSpecNet)   peak   = r;
      if (r.largeSpecNet < trough.largeSpecNet) trough = r;
    }
    return { peakNet: peak.largeSpecNet, peakDate: peak.date, troughNet: trough.largeSpecNet, troughDate: trough.date };
  }, [rows]);

  const cls        = indexCls(cotIndex);
  const zoneLabel  = indexZoneLabel(cotIndex);
  const interp     = interpretation(cotIndex, index52w, signal, pair);

  // Third track: server-computed all-time index when available; otherwise fall
  // back to a percentile over the rows that happen to be loaded client-side.
  const hasAllTime  = cotIndexAll != null;
  const trackWeeks  = hasAllTime ? totalWeeks : rows.length;
  const trackYrs    = Math.round(trackWeeks / 52);
  const thirdValue  = hasAllTime ? cotIndexAll : indexApprox;
  const thirdLabel  = hasAllTime ? "All-time" : "Loaded history";
  const thirdWeeks  = trackYrs >= 2 ? `~${trackYrs}yr` : `${trackWeeks}w`;

  // ── Compact ring mode (used in CotCard and detail page header) ────────────
  if (compact) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className="relative flex items-center justify-center size-[72px]">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="29" fill="none" stroke="currentColor" strokeWidth="7" className="text-track" />
            <circle
              cx="36" cy="36" r="29" fill="none"
              stroke="currentColor" strokeWidth="7" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 29}`}
              strokeDashoffset={`${2 * Math.PI * 29 * (1 - cotIndex / 100)}`}
              transform="rotate(-90 36 36)"
              className={cn("transition-[stroke-dashoffset] duration-700 ease-app", cls.textCls)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("font-display font-bold tabular-nums leading-none text-[18px]", cls.textCls)}>
              {cotIndex}
            </span>
            <span className="font-medium leading-none mt-0.5 text-[9px] text-ink-dim">/100</span>
          </div>
        </div>
        <div className={cn("text-center font-semibold leading-tight px-2 py-0.5 rounded text-[10.5px] max-w-[80px]", cls.badgeBgCls, cls.badgeTextCls)}>
          {zoneLabel}
        </div>
        <div className="text-center text-[9.5px] text-ink-dim">COT Index · 3yr</div>
      </div>
    );
  }

  // ── Full mode (detail page) ───────────────────────────────────────────────
  return (
    <div className="rounded-2xl overflow-hidden bg-panel border border-line">

      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3 border-b border-line">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-dim">
              COT Index
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-[rgba(8,174,170,0.08)] text-teal border border-[rgba(8,174,170,0.18)]">
              {totalWeeks >= 156 ? "3yr · 156w range" : `${totalWeeks}w range`}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn("font-display font-bold tabular-nums text-[40px] leading-none", cls.textCls)}>
              {cotIndex}
            </span>
            <span className="text-base text-ink-dim">/100</span>
            <span className={cn("inline-flex items-center text-[12px] font-semibold px-2.5 py-1 rounded-full", cls.badgeBgCls, cls.badgeTextCls)}>
              {zoneLabel}
            </span>
          </div>
        </div>

        {/* Current net callout */}
        <div className="flex flex-col items-end gap-0.5 shrink-0 px-3 py-2 rounded-xl bg-panel-2 border border-line">
          <span className="text-[10px] uppercase tracking-wide font-medium text-ink-dim">Current net</span>
          <span className={cn(
            "font-display font-bold tabular-nums text-[18px] tracking-[-0.01em]",
            (rows[0]?.largeSpecNet ?? 0) >= 0 ? "text-teal-bright" : "text-coral-bright"
          )}>
            {fmtNet(rows[0]?.largeSpecNet ?? 0)}
          </span>
          <span className="text-[10px] text-ink-dim">Large Spec net</span>
        </div>
      </div>

      {/* Three-range tracks */}
      <div className="px-5 py-4 flex flex-col gap-4">
        <RangeTrack value={index52w}   label="1-year"    weeks="52w"        cls={indexCls(index52w)}   />
        <RangeTrack value={cotIndex}   label="3-year"    weeks="156w"       cls={indexCls(cotIndex)}   />
        <RangeTrack value={thirdValue} label={thirdLabel} weeks={thirdWeeks} cls={indexCls(thirdValue)} />

        {/* Zone key */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(234,82,61,0.10)] text-coral">
            0–20 extreme short
          </span>
          <span className="text-[10px] text-ink-dim">40–60 neutral</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(8,174,170,0.10)] text-teal">
            80–100 extreme long
          </span>
        </div>
      </div>

      {/* Peak / current / trough anchors */}
      <div className="px-5 py-3 grid grid-cols-3 gap-2 border-t border-line bg-panel-2">
        <div>
          <div className="text-[10px] uppercase tracking-wide font-medium mb-0.5 text-ink-dim">Period peak</div>
          <div className="font-semibold tabular-nums text-[13px] text-teal-bright">{fmtNet(peakNet)}</div>
          <div className="text-[10px] text-ink-dim">{fmtDate(peakDate)}</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-[10px] uppercase tracking-wide font-medium mb-0.5 text-ink-dim">Current</div>
          <div className={cn("font-semibold tabular-nums text-[13px]", cls.textCls)}>{fmtNet(rows[0]?.largeSpecNet ?? 0)}</div>
          <div className="text-[10px] text-ink-dim">{fmtDate(rows[0]?.date ?? "")}</div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-[10px] uppercase tracking-wide font-medium mb-0.5 text-ink-dim">Period trough</div>
          <div className="font-semibold tabular-nums text-[13px] text-coral-bright">{fmtNet(troughNet)}</div>
          <div className="text-[10px] text-ink-dim">{fmtDate(troughDate)}</div>
        </div>
      </div>

      {/* Interpretation */}
      <div className={cn("mx-5 mb-4 mt-3 rounded-xl px-4 py-3 flex items-start gap-2.5 border", cls.badgeBgCls, cls.badgeBorderCls)}>
        <Icon name="psychology" size={14} fill className={cn("shrink-0 mt-px", cls.textCls)} />
        <p className="text-[12px] leading-relaxed text-ink-mid">{interp}</p>
      </div>
    </div>
  );
}
