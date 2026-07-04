"use client";

import { useMemo } from "react";
import { Icon } from "@/components/ui";
import type { CotSignal } from "@/app/api/cot/route";

// Minimal row type — satisfied by both CotWeek and CotDetailRow
type CotRow = { largeSpecNet: number; date: string };

interface CotIndexDisplayProps {
  rows:        CotRow[];
  cotIndex:    number;       // primary API index (3yr post-refresh)
  signal:      CotSignal;
  pair:        string;
  totalWeeks:  number;
  compact?:    boolean;      // true = ring-only mode for cards
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

function indexColor(idx: number): string {
  if (idx <= 20) return "var(--coral-bright)";
  if (idx <= 35) return "var(--coral)";
  if (idx >= 80) return "var(--teal-bright)";
  if (idx >= 65) return "var(--teal)";
  return "var(--gold)";
}

function indexBadge(idx: number): { bg: string; color: string } {
  if (idx <= 20) return { bg: "rgba(255,89,66,0.12)",  color: "var(--coral-bright)" };
  if (idx <= 35) return { bg: "rgba(234,82,61,0.10)",  color: "var(--coral)"        };
  if (idx >= 80) return { bg: "rgba(48,232,223,0.12)", color: "var(--teal-bright)"  };
  if (idx >= 65) return { bg: "rgba(8,174,170,0.10)",  color: "var(--teal)"         };
  return { bg: "rgba(248,185,61,0.10)", color: "var(--gold)" };
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

function RangeTrack({ value, label, weeks, color }: { value: number; label: string; weeks: string; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium" style={{ color: "var(--ink-mid)" }}>{label}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--panel-2)", color: "var(--ink-dim)" }}>
            {weeks}
          </span>
        </div>
        <span className="text-[13px] font-bold tabular-nums" style={{ color }}>
          {value}
          <span className="text-[10px] font-normal ml-0.5" style={{ color: "var(--ink-dim)" }}>/100</span>
        </span>
      </div>
      <div className="relative rounded-full overflow-hidden" style={{ height: 6, background: "var(--track)" }}>
        <div className="absolute top-0 left-0 h-full" style={{ width: "20%", background: "rgba(234,82,61,0.15)" }} />
        <div className="absolute top-0 right-0 h-full" style={{ width: "20%", background: "rgba(8,174,170,0.15)" }} />
        <div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{ width: `${value}%`, background: color, opacity: 0.45, transition: "width 700ms var(--ease-app)" }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full border-2"
          style={{
            left: `${value}%`, width: 12, height: 12,
            background: "var(--panel)", borderColor: color,
            transition: "left 700ms var(--ease-app)",
          }}
        />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CotIndexDisplay({ rows, cotIndex, signal, pair, totalWeeks, compact = false }: CotIndexDisplayProps) {
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

  const color      = indexColor(cotIndex);
  const badge      = indexBadge(cotIndex);
  const zoneLabel  = indexZoneLabel(cotIndex);
  const approxYrs  = Math.round(rows.length / 52);
  const approxLabel = approxYrs >= 2 ? `~${approxYrs}yr` : `${rows.length}w`;
  const interp     = interpretation(cotIndex, index52w, signal, pair);

  // ── Compact ring mode (used in CotCard and detail page header) ────────────
  if (compact) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="29" fill="none" stroke="var(--track)" strokeWidth="7" />
            <circle
              cx="36" cy="36" r="29" fill="none"
              stroke={color} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 29}`}
              strokeDashoffset={`${2 * Math.PI * 29 * (1 - cotIndex / 100)}`}
              transform="rotate(-90 36 36)"
              style={{ transition: "stroke-dashoffset 700ms var(--ease-app)" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display font-bold tabular-nums leading-none" style={{ fontSize: 18, color }}>
              {cotIndex}
            </span>
            <span className="font-medium leading-none mt-0.5" style={{ fontSize: 9, color: "var(--ink-dim)" }}>/100</span>
          </div>
        </div>
        <div className="text-center font-semibold leading-tight px-2 py-0.5 rounded" style={{ fontSize: 10.5, maxWidth: 80, ...badge }}>
          {zoneLabel}
        </div>
        <div className="text-center" style={{ fontSize: 9.5, color: "var(--ink-dim)" }}>COT Index · 3yr</div>
      </div>
    );
  }

  // ── Full mode (detail page) ───────────────────────────────────────────────
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--panel)", border: "1px solid var(--line)" }}>

      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3" style={{ borderBottom: "1px solid var(--line)" }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-dim)" }}>
              COT Index
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{ background: "rgba(8,174,170,0.08)", color: "var(--teal)", border: "1px solid rgba(8,174,170,0.18)" }}
            >
              {totalWeeks >= 156 ? "3yr · 156w range" : `${totalWeeks}w range`}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold tabular-nums" style={{ fontSize: 40, lineHeight: 1, color }}>
              {cotIndex}
            </span>
            <span style={{ fontSize: 16, color: "var(--ink-dim)" }}>/100</span>
            <span className="inline-flex items-center text-[12px] font-semibold px-2.5 py-1 rounded-full" style={badge}>
              {zoneLabel}
            </span>
          </div>
        </div>

        {/* Current net callout */}
        <div
          className="flex flex-col items-end gap-0.5 shrink-0 px-3 py-2 rounded-xl"
          style={{ background: "var(--panel-2)", border: "1px solid var(--line)" }}
        >
          <span className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "var(--ink-dim)" }}>Current net</span>
          <span
            className="font-display font-bold tabular-nums"
            style={{ fontSize: 18, letterSpacing: "-0.01em", color: (rows[0]?.largeSpecNet ?? 0) >= 0 ? "var(--teal-bright)" : "var(--coral-bright)" }}
          >
            {fmtNet(rows[0]?.largeSpecNet ?? 0)}
          </span>
          <span className="text-[10px]" style={{ color: "var(--ink-dim)" }}>Large Spec net</span>
        </div>
      </div>

      {/* Three-range tracks */}
      <div className="px-5 py-4 flex flex-col gap-4">
        <RangeTrack value={index52w}    label="1-year"            weeks="52w"        color={indexColor(index52w)}    />
        <RangeTrack value={cotIndex}    label="3-year"            weeks="156w"       color={indexColor(cotIndex)}    />
        <RangeTrack value={indexApprox} label="Available history" weeks={approxLabel} color={indexColor(indexApprox)} />

        {/* Zone key */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "rgba(234,82,61,0.10)", color: "var(--coral)" }}>
            0–20 extreme short
          </span>
          <span className="text-[10px]" style={{ color: "var(--ink-dim)" }}>40–60 neutral</span>
          <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "rgba(8,174,170,0.10)", color: "var(--teal)" }}>
            80–100 extreme long
          </span>
        </div>
      </div>

      {/* Peak / current / trough anchors */}
      <div
        className="px-5 py-3 grid grid-cols-3 gap-2"
        style={{ borderTop: "1px solid var(--line)", background: "var(--panel-2)" }}
      >
        <div>
          <div className="text-[10px] uppercase tracking-wide font-medium mb-0.5" style={{ color: "var(--ink-dim)" }}>Period peak</div>
          <div className="font-semibold tabular-nums text-[13px]" style={{ color: "var(--teal-bright)" }}>{fmtNet(peakNet)}</div>
          <div className="text-[10px]" style={{ color: "var(--ink-dim)" }}>{fmtDate(peakDate)}</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-[10px] uppercase tracking-wide font-medium mb-0.5" style={{ color: "var(--ink-dim)" }}>Current</div>
          <div className="font-semibold tabular-nums text-[13px]" style={{ color }}>{fmtNet(rows[0]?.largeSpecNet ?? 0)}</div>
          <div className="text-[10px]" style={{ color: "var(--ink-dim)" }}>{fmtDate(rows[0]?.date ?? "")}</div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-[10px] uppercase tracking-wide font-medium mb-0.5" style={{ color: "var(--ink-dim)" }}>Period trough</div>
          <div className="font-semibold tabular-nums text-[13px]" style={{ color: "var(--coral-bright)" }}>{fmtNet(troughNet)}</div>
          <div className="text-[10px]" style={{ color: "var(--ink-dim)" }}>{fmtDate(troughDate)}</div>
        </div>
      </div>

      {/* Interpretation */}
      <div
        className="mx-5 mb-4 mt-3 rounded-xl px-4 py-3 flex items-start gap-2.5"
        style={{ background: badge.bg, border: `1px solid ${badge.bg}` }}
      >
        <Icon name="psychology" size={14} fill style={{ color, flexShrink: 0, marginTop: 1 }} />
        <p className="text-[12px] leading-relaxed" style={{ color: "var(--ink-mid)" }}>{interp}</p>
      </div>
    </div>
  );
}
