"use client";

// Positioning history chart for the COT detail page: Large Spec vs Commercial
// net positions over the loaded weeks (Retail joins when the table's Retail
// toggle is on). One shared y-axis in contracts, an emphasized zero line for
// the long/short polarity, crosshair + tooltip on hover. Below the main plot,
// a second pane tracks the rolling 3-year COT Index (0–100) with the extreme
// zones (≥80 / ≤20) tinted — same x-axis, shared crosshair. Series colors come
// from the theme-scoped --chart-* tokens (validated per surface); a full data
// table sits directly below the chart on the same page.

import { useMemo, useRef, useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import type { CotDetailRow } from "@/lib/cot/types";

interface PositioningChartProps {
  rows:       CotDetailRow[]; // newest first (as served by the API)
  showRetail: boolean;
}

const MAIN_H  = 264; // main pane plot height incl. its top margin
const GAP     = 18;  // gap between panes (holds the index pane's label)
const INDEX_H = 84;  // index pane plot height
const M = { top: 16, right: 96, bottom: 26, left: 56 };
const H = MAIN_H + GAP + INDEX_H + M.bottom;

interface SeriesDef {
  key:   "ls" | "comm" | "ss";
  name:  string;
  color: string; // CSS var reference — SVG stroke prop, not a className
}

const SERIES: SeriesDef[] = [
  { key: "ls",   name: "Large Spec",  color: "var(--chart-ls)"     },
  { key: "comm", name: "Commercials", color: "var(--chart-comm)"   },
  { key: "ss",   name: "Retail",      color: "var(--chart-retail)" },
];

function fmtTick(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${sign}${Math.round(abs / 1_000)}K`;
  return `${sign}${abs}`;
}

function fmtVal(n: number): string {
  return (n >= 0 ? "+" : "−") + Math.abs(n).toLocaleString();
}

function fmtDateLong(iso: string): string {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function fmtDateTick(iso: string, spanWeeks: number): string {
  const d = new Date(iso + "T12:00:00Z");
  return spanWeeks > 130
    ? d.toLocaleDateString("en-US", { year: "numeric" })
    : d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

/** ~5 "nice" y ticks covering [min, max], always including 0. */
function niceTicks(min: number, max: number): number[] {
  const span = max - min || 1;
  const rawStep = span / 4;
  const mag  = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= 5) ?? 10 * mag;
  const ticks: number[] = [];
  for (let t = Math.ceil(min / step) * step; t <= max + step * 0.01; t += step) {
    ticks.push(Math.round(t));
  }
  if (!ticks.some((t) => t === 0) && min < 0 && max > 0) ticks.push(0);
  return ticks.sort((a, b) => a - b);
}

export function PositioningChart({ rows, showRetail }: PositioningChartProps) {
  // Chronological order for drawing (oldest → newest, left → right)
  const data = useMemo(() => [...rows].reverse(), [rows]);

  // Responsive width via container measurement
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const visibleSeries = useMemo(
    () => SERIES.filter((s) => s.key !== "ss" || showRetail),
    [showRetail]
  );

  const chart = useMemo(() => {
    if (!data.length || width < 200) return null;

    const val = (r: CotDetailRow, key: SeriesDef["key"]) =>
      key === "ls" ? r.largeSpecNet : key === "comm" ? r.commercialNet : r.smallSpecNet;

    const all = data.flatMap((r) => visibleSeries.map((s) => val(r, s.key)));
    const yMin = Math.min(0, ...all);
    const yMax = Math.max(0, ...all);
    const pad  = (yMax - yMin || 1) * 0.06;

    const innerW = width - M.left - M.right;
    const innerH = MAIN_H - M.top;
    const x = (i: number) => M.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = (v: number) => M.top + innerH - ((v - (yMin - pad)) / ((yMax + pad) - (yMin - pad))) * innerH;

    // Index pane: 0–100 mapped into its own band below the main plot
    const idxTop = MAIN_H + GAP;
    const yIdx = (v: number) => idxTop + (1 - v / 100) * INDEX_H;
    // Line breaks where cotIndex3yr is null (weeks with <26w trailing history)
    let idxPath = "";
    let pen = false;
    data.forEach((r, i) => {
      if (r.cotIndex3yr == null) { pen = false; return; }
      idxPath += `${pen ? "L" : "M"}${x(i).toFixed(1)},${yIdx(r.cotIndex3yr).toFixed(1)}`;
      pen = true;
    });
    const hasIndex = idxPath !== "";

    const paths = visibleSeries.map((s) => ({
      ...s,
      d: data.map((r, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(val(r, s.key)).toFixed(1)}`).join(""),
      endY: y(val(data[data.length - 1], s.key)),
      endV: val(data[data.length - 1], s.key),
    }));

    // Nudge direct end-labels apart when they collide
    const sorted = [...paths].sort((a, b) => a.endY - b.endY);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].endY - sorted[i - 1].endY < 14) sorted[i].endY = sorted[i - 1].endY + 14;
    }

    // ~5 x-axis date ticks
    const tickCount = Math.min(6, Math.max(2, Math.floor(innerW / 110)));
    const xTicks = Array.from({ length: tickCount }, (_, i) =>
      Math.round((i / (tickCount - 1)) * (data.length - 1))
    );

    return { x, y, paths, yTicks: niceTicks(yMin - pad, yMax + pad), xTicks, innerW, val, yIdx, idxTop, idxPath, hasIndex };
  }, [data, width, visibleSeries]);

  if (rows.length < 2) return null;

  const hover = hoverIdx != null && chart ? data[hoverIdx] : null;

  function onMove(e: React.MouseEvent<SVGRectElement>) {
    if (!chart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    setHoverIdx(Math.round(Math.max(0, Math.min(1, frac)) * (data.length - 1)));
  }

  return (
    <div className="rounded-2xl mb-6 bg-panel border border-line">
      {/* Header + legend */}
      <div className="flex items-center gap-4 px-5 py-3 flex-wrap border-b border-line">
        <span className="text-[13px] font-semibold text-ink-strong">Positioning history</span>
        <div className="flex items-center gap-3.5">
          {visibleSeries.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-[11.5px] text-ink-mid">
              <span className="inline-block w-3.5 h-0.5 rounded-full" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
        <span className="ml-auto text-[11px] text-ink-dim">
          {data.length} weeks · net contracts · load older weeks below to extend
        </span>
      </div>

      {/* Plot */}
      <div ref={wrapRef} className="relative px-1 py-2">
        {chart && (
          <svg width="100%" height={H} className="block">
            {/* Recessive y grid + tick labels */}
            {chart.yTicks.map((t) => (
              <g key={t}>
                <line
                  x1={M.left} x2={width - M.right} y1={chart.y(t)} y2={chart.y(t)}
                  stroke={t === 0 ? "var(--ink-dim)" : "var(--track)"}
                  strokeWidth={t === 0 ? 1.25 : 1}
                />
                <text
                  x={M.left - 8} y={chart.y(t) + 3.5}
                  textAnchor="end"
                  className="fill-ink-dim text-[10px] tabular-nums font-sans"
                >
                  {fmtTick(t)}
                </text>
              </g>
            ))}

            {/* X date ticks */}
            {chart.xTicks.map((i) => (
              <text
                key={i}
                x={chart.x(i)} y={H - 6}
                textAnchor="middle"
                className="fill-ink-dim text-[10px] tabular-nums font-sans"
              >
                {fmtDateTick(data[i].date, data.length)}
              </text>
            ))}

            {/* Series lines + direct end labels */}
            {chart.paths.map((p) => (
              <g key={p.key}>
                <path d={p.d} fill="none" stroke={p.color} strokeWidth={2} strokeLinejoin="round" />
                <text
                  x={width - M.right + 8} y={p.endY + 3.5}
                  className="text-[10.5px] font-semibold font-sans"
                  style={{ fill: p.color }}
                >
                  {p.name}
                </text>
              </g>
            ))}

            {/* Index pane: rolling 3-yr COT Index with extreme zones */}
            {chart.hasIndex && (
              <g>
                <text
                  x={M.left} y={chart.idxTop - 6}
                  className="fill-ink-dim text-[10px] font-semibold font-sans"
                >
                  3-yr COT Index
                </text>
                {/* Extreme-zone tints: ≥80 (bullish extreme) and ≤20 (bearish extreme) */}
                <rect
                  x={M.left} y={chart.yIdx(100)}
                  width={Math.max(0, chart.innerW)} height={chart.yIdx(80) - chart.yIdx(100)}
                  fill="var(--teal)" fillOpacity={0.07}
                />
                <rect
                  x={M.left} y={chart.yIdx(20)}
                  width={Math.max(0, chart.innerW)} height={chart.yIdx(0) - chart.yIdx(20)}
                  fill="var(--coral)" fillOpacity={0.07}
                />
                {[0, 20, 50, 80, 100].map((t) => (
                  <g key={t}>
                    <line
                      x1={M.left} x2={width - M.right} y1={chart.yIdx(t)} y2={chart.yIdx(t)}
                      stroke="var(--track)" strokeWidth={1}
                      strokeDasharray={t === 20 || t === 80 ? "3 3" : undefined}
                    />
                    {(t === 0 || t === 50 || t === 100) && (
                      <text
                        x={M.left - 8} y={chart.yIdx(t) + 3.5}
                        textAnchor="end"
                        className="fill-ink-dim text-[10px] tabular-nums font-sans"
                      >
                        {t}
                      </text>
                    )}
                  </g>
                ))}
                <path d={chart.idxPath} fill="none" stroke="var(--chart-ls)" strokeWidth={2} strokeLinejoin="round" />
              </g>
            )}

            {/* Crosshair + hover markers */}
            {hover && hoverIdx != null && (
              <g>
                <line
                  x1={chart.x(hoverIdx)} x2={chart.x(hoverIdx)}
                  y1={M.top} y2={H - M.bottom}
                  stroke="var(--ink-dim)" strokeWidth={1} strokeDasharray="3 3"
                />
                {visibleSeries.map((s) => (
                  <circle
                    key={s.key}
                    cx={chart.x(hoverIdx)}
                    cy={chart.y(chart.val(hover, s.key))}
                    r={4.5}
                    fill={s.color}
                    stroke="var(--panel)"
                    strokeWidth={2}
                  />
                ))}
                {chart.hasIndex && hover.cotIndex3yr != null && (
                  <circle
                    cx={chart.x(hoverIdx)}
                    cy={chart.yIdx(hover.cotIndex3yr)}
                    r={4}
                    fill="var(--chart-ls)"
                    stroke="var(--panel)"
                    strokeWidth={2}
                  />
                )}
              </g>
            )}

            {/* Hover capture */}
            <rect
              x={M.left} y={M.top}
              width={Math.max(0, width - M.left - M.right)} height={H - M.top - M.bottom}
              fill="transparent"
              onMouseMove={onMove}
              onMouseLeave={() => setHoverIdx(null)}
            />
          </svg>
        )}

        {/* Tooltip */}
        {hover && hoverIdx != null && chart && (
          <div
            className={cn(
              "absolute z-10 pointer-events-none rounded-xl px-3 py-2.5 text-[11.5px] leading-relaxed",
              "bg-panel border border-line shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
            )}
            style={{
              top: M.top + 4,
              ...(chart.x(hoverIdx) > width / 2
                ? { right: width - chart.x(hoverIdx) + 14 }
                : { left: chart.x(hoverIdx) + 14 }),
            }}
          >
            <div className="font-semibold mb-1 text-ink-strong">{fmtDateLong(hover.date)}</div>
            {visibleSeries.map((s) => (
              <div key={s.key} className="flex items-center gap-2 tabular-nums text-ink-mid">
                <span className="inline-block w-2.5 h-0.5 rounded-full" style={{ background: s.color }} />
                <span className="min-w-[78px]">{s.name}</span>
                <span className="font-semibold text-ink-strong">{fmtVal(chart.val(hover, s.key))}</span>
              </div>
            ))}
            {(hover.cotIndex3yr != null || (hover.openInterest != null && hover.openInterest > 0)) && (
              <div className="mt-1 pt-1 border-t border-line">
                {hover.cotIndex3yr != null && (
                  <div className="flex items-center gap-2 tabular-nums text-ink-dim">
                    <span className="inline-block w-2.5" />
                    <span className="min-w-[78px]">3-yr index</span>
                    <span className="font-medium text-ink-mid">{hover.cotIndex3yr}</span>
                  </div>
                )}
                {hover.openInterest != null && hover.openInterest > 0 && (
                  <div className="flex items-center gap-2 tabular-nums text-ink-dim">
                    <span className="inline-block w-2.5" />
                    <span className="min-w-[78px]">Open interest</span>
                    <span className="font-medium text-ink-mid">{hover.openInterest.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
