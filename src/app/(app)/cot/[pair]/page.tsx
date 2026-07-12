"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon, Skeleton } from "@/components/ui";
import { CotIndexDisplay } from "@/components/cot/CotIndexDisplay";
import { CotLockScreen } from "@/components/cot/CotLockScreen";
import { PositioningChart } from "@/components/cot/PositioningChart";
import { GavoCotRead } from "@/components/cot/GavoCotRead";
import { SignalBars } from "@/components/cot/SignalBars";
import { buildCotCommentary } from "@/lib/cot/commentary";
import { cn } from "@/lib/cn";
import type { CotDetailRow, CotDetailResponse } from "@/lib/cot/types";

// ── Heat map ──────────────────────────────────────────────────────────────────
// Per-cell background intensity computed from live row data — inherently
// dynamic (continuous 0-1 range per cell), can't be a static Tailwind class.

function heatBg(value: number, min: number, max: number): string {
  if (value >= 0) {
    const intensity = max > 0 ? Math.min(value / max, 1) * 0.78 : 0;
    return `rgba(8,174,170,${intensity.toFixed(3)})`;
  } else {
    const intensity = min < 0 ? Math.min(Math.abs(value) / Math.abs(min), 1) * 0.78 : 0;
    return `rgba(234,82,61,${intensity.toFixed(3)})`;
  }
}

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtNet(n: number): string {
  return (n >= 0 ? "+" : "−") + Math.abs(n).toLocaleString();
}

function fmtRaw(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString();
}

function fmtDateShort(iso: string): string {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function fmtPct(part: number, whole: number): string {
  const pct = (part / whole) * 100;
  const abs = Math.abs(pct);
  if (abs > 0 && abs < 1) return `${pct < 0 ? "-" : ""}<1%`;
  return `${pct.toFixed(0)}%`;
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-5">
      {Array.from({ length: 16 }).map((_, i) => (
        <Skeleton key={i} h={34} w="100%" r={3} />
      ))}
    </div>
  );
}

// ── Shared cell classes (static parts only — dynamic backgrounds/colors stay inline) ──

const thBase   = "align-middle whitespace-nowrap uppercase font-bold text-ink-dim bg-panel border-b border-line";
const thSub    = "align-middle whitespace-nowrap uppercase font-semibold border-b-2 border-line";
const cellCls  = "px-3.5 py-2 whitespace-nowrap [font-feature-settings:'tnum'] text-[12px]";
const dimCellCls = cn(cellCls, "text-right text-ink-dim font-normal");
const avgCellCls = "px-3.5 py-2 whitespace-nowrap [font-feature-settings:'tnum'] text-[11.5px] text-ink-dim font-medium border-b-2 border-line";

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CotPairPage() {
  const { pair } = useParams<{ pair: string }>();
  const router   = useRouter();

  const [data,        setData]        = useState<CotDetailResponse | null>(null);
  const [rows,        setRows]        = useState<CotDetailRow[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [offset,      setOffset]      = useState(0);
  const [total,       setTotal]       = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState(false);
  const [locked,      setLocked]      = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cot/${pair}?offset=0`)
      .then((r) => {
        if (r.status === 403) throw new Error("locked");
        if (!r.ok) throw new Error("not found");
        return r.json() as Promise<CotDetailResponse>;
      })
      .then((d) => {
        setData(d);
        setRows(d.rows);
        setTotal(d.totalWeeks);
        setOffset(d.rows.length);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (e.message === "locked") setLocked(true);
        else setError(true);
        setLoading(false);
      });
  }, [pair]);

  function loadMore() {
    setLoadingMore(true);
    fetch(`/api/cot/${pair}?offset=${offset}`)
      .then((r) => r.json() as Promise<CotDetailResponse>)
      .then((d) => {
        setRows((prev) => [...prev, ...d.rows]);
        setOffset((o) => o + d.rows.length);
        setLoadingMore(false);
      })
      .catch(() => setLoadingMore(false));
  }

  // Per-column min/max for heat map (recomputed when rows extend)
  const ranges = useMemo(() => {
    if (!rows.length) return null;
    const ls   = rows.map((r) => r.largeSpecNet);
    const cs   = rows.map((r) => r.commercialNet);
    const ss   = rows.map((r) => r.smallSpecNet);
    const wows = rows.slice(0, -1).map((r, i) => r.largeSpecNet - rows[i + 1].largeSpecNet);
    return {
      lsMin:  Math.min(...ls),  lsMax:  Math.max(...ls),
      cMin:   Math.min(...cs),  cMax:   Math.max(...cs),
      ssMin:  Math.min(...ss),  ssMax:  Math.max(...ss),
      wowMin: wows.length ? Math.min(...wows) : -1,
      wowMax: wows.length ? Math.max(...wows) : 1,
    };
  }, [rows]);

  // 13-week average — pinned row above the data table
  const avg13 = useMemo(() => {
    const slice = rows.slice(0, 13);
    if (slice.length < 2) return null;
    const n   = slice.length;
    const avg = (fn: (r: CotDetailRow) => number) => Math.round(slice.reduce((s, r) => s + fn(r), 0) / n);
    const wows = slice.slice(0, -1).map((r, i) => r.largeSpecNet - slice[i + 1].largeSpecNet);
    const avgWow = wows.length ? Math.round(wows.reduce((s, v) => s + v, 0) / wows.length) : null;
    const hasLS = slice.some((r) => r.largeSpecLong != null);
    const totalLong = slice.reduce((s, r) => s + (r.largeSpecLong ?? 0), 0);
    const totalPos  = slice.reduce((s, r) => s + (r.largeSpecLong ?? 0) + (r.largeSpecShort ?? 0), 0);
    return {
      largeSpecNet:    avg((r) => r.largeSpecNet),
      largeSpecLong:   hasLS ? avg((r) => r.largeSpecLong ?? 0) : null,
      largeSpecShort:  hasLS ? avg((r) => r.largeSpecShort ?? 0) : null,
      commercialNet:   avg((r) => r.commercialNet),
      commercialLong:  hasLS ? avg((r) => r.commercialLong ?? 0) : null,
      commercialShort: hasLS ? avg((r) => r.commercialShort ?? 0) : null,
      smallSpecNet:    avg((r) => r.smallSpecNet),
      smallSpecLong:   hasLS ? avg((r) => r.smallSpecLong ?? 0) : null,
      smallSpecShort:  hasLS ? avg((r) => r.smallSpecShort ?? 0) : null,
      pctLong: totalPos > 0 && hasLS ? Math.round((totalLong / totalPos) * 100) : null,
      avgWow,
    };
  }, [rows]);

  const [showSmallSpec, setShowSmallSpec] = useState(false);

  // Shared commentary — the SAME engine the overview card uses, so the card
  // and this page never say different things about the same report.
  const commentary = useMemo(() => {
    if (!data || rows.length < 2) return null;
    const nets52 = rows.slice(0, 52).map((r) => r.largeSpecNet);
    const min52  = Math.min(...nets52);
    const max52  = Math.max(...nets52);
    const cotIndex52w = nets52.length >= 52
      ? Math.round(Math.max(0, Math.min(100, ((rows[0].largeSpecNet - min52) / (max52 - min52 || 1)) * 100)))
      : null;
    return buildCotCommentary({
      pair:           data.pair,
      divergenceType: data.divergenceType,
      wowChange:      data.wowChange,
      lsChange:       rows[0].largeSpecNet  - rows[1].largeSpecNet,
      cChange:        rows[0].commercialNet - rows[1].commercialNet,
      cotIndex:       data.cotIndex,
      cotIndex52w,
      cotIndexAll:    data.cotIndexAll,
      signal:         data.signal,
      largeSpecNet:   rows[0].largeSpecNet,
      openInterest:   rows[0].openInterest,
      grossHistory:   rows.slice(0, 6).map((r) => ({ long: r.largeSpecLong, short: r.largeSpecShort })),
      inverted:       data.usdBase,
    });
  }, [data, rows]);

  if (locked) return <CotLockScreen />;

  return (
    <div className="view">

      {/* ── Back link ── */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1.5 mb-5 text-[13px] font-semibold transition-colors hover:opacity-80 active:scale-95 text-ink-dim"
      >
        <Icon name="arrow_back" size={16} />
        COT Reports
      </button>

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1
              title={data?.label}
              className={cn("font-display font-bold text-[28px] tracking-[-0.025em] text-ink-strong", data?.label && "cursor-help")}
            >
              {pair.toUpperCase()}
            </h1>
            {data && (
              <>
                <SignalBars signal={data.signal} size="lg" />
                {data.synthetic && (
                  <span
                    title={`No direct CFTC contract exists for ${data.pair} — this signal is derived from its two legs' own currency positioning.`}
                    className="inline-flex items-center justify-center size-6 rounded cursor-help bg-panel-2 text-ink-dim border border-line"
                  >
                    <Icon name="auto_awesome" size={13} />
                  </span>
                )}
                {data.usdBase && (
                  <span
                    title="Positions shown for the foreign currency futures. Net positive = bullish on the USD pair."
                    className="inline-flex items-center justify-center size-6 rounded cursor-help bg-panel-2 text-ink-dim border border-line"
                  >
                    <Icon name="swap_horiz" size={13} />
                  </span>
                )}
              </>
            )}
          </div>
          {data && (
            <p className="text-[13px] text-ink-dim">
              CFTC report week ending {data.reportDate} · {total.toLocaleString()} weeks in database
            </p>
          )}
        </div>

        {/* Current reading summary */}
        {data && rows.length > 0 && (
          <div className="flex items-center gap-5 flex-wrap shrink-0">
            {/* COT Index — compact */}
            <CotIndexDisplay
              rows={rows}
              cotIndex={data.cotIndex}
              cotIndexAll={data.cotIndexAll}
              totalWeeks={data.totalWeeks}
              compact
            />

            {/* WoW change */}
            <div className="text-right">
              <div className={cn("font-display font-bold tabular-nums text-[22px] tracking-[-0.02em]", data.wowChange >= 0 ? "text-teal-bright" : "text-coral-bright")}>
                {fmtNet(data.wowChange)}
              </div>
              <div className="text-[11px] text-ink-dim">WoW change</div>
            </div>

            {/* Open interest */}
            {rows[0]?.openInterest != null && rows[0].openInterest > 0 && (
              <div className="text-right">
                <div className="font-display font-bold tabular-nums text-[22px] tracking-[-0.02em] text-ink-strong">
                  {rows[0].openInterest.toLocaleString()}
                </div>
                <div className="text-[11px] text-ink-dim">
                  Open interest · net {fmtPct(rows[0].largeSpecNet, rows[0].openInterest)} of OI
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Full COT Index display — three-range comparison + interpretation ── */}
      {!error && !loading && data && rows.length > 0 && (
        <div className="mb-6">
          <CotIndexDisplay
            rows={rows}
            cotIndex={data.cotIndex}
            cotIndexAll={data.cotIndexAll}
            totalWeeks={data.totalWeeks}
            commentary={commentary}
          />
        </div>
      )}

      {/* ── Positioning history chart ── */}
      {!error && !loading && rows.length > 1 && (
        <PositioningChart rows={rows} showRetail={showSmallSpec} />
      )}

      {/* ── Gavo COT Read ── */}
      {!error && !loading && rows.length > 1 && (
        <GavoCotRead pair={pair.toUpperCase()} />
      )}

      {/* ── Error state ── */}
      {error && (
        <div className="rounded-2xl px-5 py-4 text-[13px] bg-[rgba(234,82,61,0.07)] border border-[rgba(234,82,61,0.2)] text-coral">
          Pair not found or data unavailable. <button onClick={() => router.back()} className="underline">Go back</button>
        </div>
      )}

      {/* ── Heat map table ──
           Outer container has NO overflow-hidden — that would trap sticky positioning.
           Rounded corners come from the border-radius on the container border alone.  ── */}
      {!error && (
        <div className="rounded-2xl border border-line bg-panel">
          {/* Color key — static, not sticky. You read it once at the top. */}
          <div className="flex items-center gap-5 px-5 py-3 text-[11.5px] flex-wrap border-b border-line text-ink-dim">
            <span className="font-semibold text-ink-mid">Color key</span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-[rgba(8,174,170,0.65)]" />
              Net long / increasing
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-[rgba(234,82,61,0.65)]" />
              Net short / decreasing
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-track" />
              Near zero
            </span>
            {data?.usdBase && (
              <span className="flex items-center gap-1.5 opacity-80">
                <Icon name="swap_horiz" size={12} />
                Long/Short = foreign-currency contract · Net framed for {pair.toUpperCase()}
              </span>
            )}
            <span className="flex items-center gap-1.5 ml-auto opacity-65">
              <Icon name="info" size={12} />
              Index = position within displayed range
            </span>
            <button
              type="button"
              onClick={() => setShowSmallSpec((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all active:scale-95 border",
                showSmallSpec
                  ? "bg-[rgba(8,174,170,0.12)] text-teal border-[rgba(8,174,170,0.3)]"
                  : "bg-panel-2 text-ink-dim border-line"
              )}
            >
              <Icon name={showSmallSpec ? "visibility" : "visibility_off"} size={12} />
              Retail
            </button>
          </div>

          {loading ? (
            <TableSkeleton />
          ) : (
            <div className="overflow-x-auto">
              <table className={cn("w-full border-separate border-spacing-0", showSmallSpec ? "min-w-[1020px]" : "min-w-[780px]")}>
                <thead>
                  {/* Group row */}
                  <tr>
                    <th rowSpan={2} className={cn(thBase, "w-[130px] px-4 py-2 text-left text-[10.5px] tracking-[0.07em]")}>
                      Week Ending
                    </th>
                    {/* Large Spec group — colspan 4: Long, Short, Net, % Long */}
                    <th
                      colSpan={4}
                      className={cn(
                        thBase,
                        "px-4 pt-[7px] pb-[5px] text-center text-[10px] tracking-[0.07em] text-teal",
                        "bg-[rgba(8,174,170,0.05)] border-l border-l-[rgba(8,174,170,0.2)] border-r border-r-[rgba(8,174,170,0.2)]"
                      )}
                    >
                      Large Spec
                    </th>
                    {/* WoW Δ */}
                    <th rowSpan={2} className={cn(thBase, "w-[88px] px-3.5 py-2 text-right text-[10.5px] tracking-[0.07em]")}>
                      WoW Δ
                    </th>
                    {/* Commercial group */}
                    <th
                      colSpan={3}
                      className={cn(
                        thBase,
                        "px-4 pt-[7px] pb-[5px] text-center text-[10px] tracking-[0.07em] text-gold",
                        "bg-[rgba(248,185,61,0.05)] border-l border-l-[rgba(248,185,61,0.2)] border-r border-r-[rgba(248,185,61,0.2)]"
                      )}
                    >
                      Commercial
                    </th>
                    {/* Small Spec group — conditional */}
                    {showSmallSpec && (
                      <th
                        colSpan={3}
                        className={cn(thBase, "px-4 pt-[7px] pb-[5px] text-center text-[10px] tracking-[0.07em] text-ink-mid border-l border-l-line")}
                      >
                        Retail
                      </th>
                    )}
                    {/* Index */}
                    <th rowSpan={2} className={cn(thBase, "w-[110px] px-4 py-2 text-left text-[10.5px] tracking-[0.07em] border-l border-l-line")}>
                      Index
                    </th>
                  </tr>
                  {/* Sub-header row */}
                  <tr>
                    {/* Large Spec sub-cols: Long, Short, Net, % Long */}
                    {(["Long", "Short", "Net", "% Long"] as const).map((label, idx) => (
                      <th
                        key={`ls-${label}`}
                        className={cn(
                          thSub,
                          "px-3.5 pt-[5px] pb-2 text-right text-[9.5px] tracking-[0.06em] bg-[rgba(8,174,170,0.05)]",
                          label === "Net" || label === "% Long" ? "text-teal" : "text-ink-dim",
                          idx === 0 && "border-l border-l-[rgba(8,174,170,0.2)]",
                          idx === 3 && "border-r border-r-[rgba(8,174,170,0.2)]"
                        )}
                      >
                        {label}
                      </th>
                    ))}
                    {/* Commercial sub-cols */}
                    {(["Long", "Short", "Net"] as const).map((label, idx) => (
                      <th
                        key={`c-${label}`}
                        className={cn(
                          thSub,
                          "px-3.5 pt-[5px] pb-2 text-right text-[9.5px] tracking-[0.06em] bg-[rgba(248,185,61,0.05)]",
                          label === "Net" ? "text-gold" : "text-ink-dim",
                          idx === 0 && "border-l border-l-[rgba(248,185,61,0.2)]",
                          idx === 2 && "border-r border-r-[rgba(248,185,61,0.2)]"
                        )}
                      >
                        {label}
                      </th>
                    ))}
                    {/* Small Spec sub-cols — conditional */}
                    {showSmallSpec && (["Long", "Short", "Net"] as const).map((label, idx) => (
                      <th
                        key={`ss-${label}`}
                        className={cn(
                          thSub,
                          "px-3.5 pt-[5px] pb-2 text-right text-[9.5px] tracking-[0.06em] bg-panel",
                          label === "Net" ? "text-ink-mid" : "text-ink-dim",
                          idx === 0 && "border-l border-l-line"
                        )}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* 13-week average — pinned reference row */}
                  {avg13 && (() => {
                    const deltaLS = rows[0] ? rows[0].largeSpecNet - avg13.largeSpecNet : 0;
                    return (
                      <tr className="bg-[rgba(8,174,170,0.025)]">
                        <td className={cn(avgCellCls, "text-left font-sans text-teal font-bold")}>
                          <span className="flex items-center gap-2">
                            13W Avg
                            <span className={cn(
                              "text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-panel-2",
                              deltaLS >= 0 ? "text-teal-bright" : "text-coral-bright"
                            )}>
                              now {fmtNet(deltaLS)} vs avg
                            </span>
                          </span>
                        </td>
                        <td className={cn(avgCellCls, "text-right border-l border-l-[rgba(8,174,170,0.15)]")}>{fmtRaw(avg13.largeSpecLong)}</td>
                        <td className={cn(avgCellCls, "text-right")}>{fmtRaw(avg13.largeSpecShort)}</td>
                        <td className={cn(avgCellCls, "text-right font-bold text-ink-mid")}>{fmtNet(avg13.largeSpecNet)}</td>
                        <td className={cn(avgCellCls, "text-right border-r border-r-[rgba(8,174,170,0.15)]")}>
                          {avg13.pctLong != null ? `${avg13.pctLong}%` : "—"}
                        </td>
                        <td className={cn(avgCellCls, "text-right font-semibold text-ink-mid")}>
                          {avg13.avgWow != null ? fmtNet(avg13.avgWow) : "—"}
                        </td>
                        <td className={cn(avgCellCls, "text-right border-l border-l-[rgba(248,185,61,0.15)]")}>{fmtRaw(avg13.commercialLong)}</td>
                        <td className={cn(avgCellCls, "text-right")}>{fmtRaw(avg13.commercialShort)}</td>
                        <td className={cn(avgCellCls, "text-right font-semibold text-ink-mid border-r border-r-[rgba(248,185,61,0.15)]")}>
                          {fmtNet(avg13.commercialNet)}
                        </td>
                        {showSmallSpec && (
                          <>
                            <td className={cn(avgCellCls, "text-right border-l border-l-line")}>{fmtRaw(avg13.smallSpecLong)}</td>
                            <td className={cn(avgCellCls, "text-right")}>{fmtRaw(avg13.smallSpecShort)}</td>
                            <td className={cn(avgCellCls, "text-right")}>{fmtNet(avg13.smallSpecNet)}</td>
                          </>
                        )}
                        <td className={cn(avgCellCls, "text-right border-l border-l-line")}>—</td>
                      </tr>
                    );
                  })()}
                  {rows.map((row, i) => {
                    const prev    = rows[i + 1];
                    const wow     = prev ? row.largeSpecNet - prev.largeSpecNet : null;
                    const isLatest = i === 0;

                    const rangeIdx = ranges && ranges.lsMax !== ranges.lsMin
                      ? Math.round(Math.max(0, Math.min(100,
                          ((row.largeSpecNet - ranges.lsMin) / (ranges.lsMax - ranges.lsMin)) * 100
                        )))
                      : 50;

                    const pctTotal = (row.largeSpecLong ?? 0) + (row.largeSpecShort ?? 0);
                    const pct = pctTotal > 0 && row.largeSpecLong != null
                      ? Math.round((row.largeSpecLong / pctTotal) * 100)
                      : null;
                    const pctColorCls = pct == null ? "text-ink-dim"
                      : pct >= 60 ? "text-teal-bright"
                      : pct <= 40 ? "text-coral-bright"
                      : "text-ink-mid";

                    return (
                      <tr key={row.date} className={isLatest ? "bg-[rgba(8,174,170,0.035)]" : undefined}>
                        {/* Date */}
                        <td className={cn(
                          cellCls, "border-b border-line font-sans",
                          isLatest ? "text-ink-strong font-semibold" : "text-ink-dim font-normal"
                        )}>
                          <span className="flex items-center gap-2">
                            {fmtDateShort(row.date)}
                            {isLatest && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded font-sans bg-[rgba(8,174,170,0.15)] text-teal">
                                Latest
                              </span>
                            )}
                          </span>
                        </td>

                        {/* Large Spec Long */}
                        <td className={cn(dimCellCls, "border-b border-line border-l border-l-[rgba(8,174,170,0.15)]")}>
                          {fmtRaw(row.largeSpecLong)}
                        </td>
                        {/* Large Spec Short */}
                        <td className={cn(dimCellCls, "border-b border-line")}>{fmtRaw(row.largeSpecShort)}</td>
                        {/* Large Spec Net — heat-map background is per-row computed data, stays inline */}
                        <td
                          className={cn(cellCls, "text-right border-b border-line font-bold text-ink-strong")}
                          style={{ background: ranges ? heatBg(row.largeSpecNet, ranges.lsMin, ranges.lsMax) : undefined }}
                        >
                          {fmtNet(row.largeSpecNet)}
                        </td>
                        {/* % Long — longs as % of total LS open interest */}
                        <td className={cn(cellCls, "text-right border-b border-line font-semibold border-r border-r-[rgba(8,174,170,0.15)]", pctColorCls)}>
                          {pct != null ? `${pct}%` : "—"}
                        </td>

                        {/* WoW Δ — heat-map background is per-row computed data, stays inline */}
                        <td
                          className={cn(cellCls, "text-right border-b border-line font-medium text-ink-strong")}
                          style={{ background: ranges && wow !== null ? heatBg(wow, ranges.wowMin, ranges.wowMax) : undefined }}
                        >
                          {wow !== null ? fmtNet(wow) : "—"}
                        </td>

                        {/* Commercial Long */}
                        <td className={cn(dimCellCls, "border-b border-line border-l border-l-[rgba(248,185,61,0.15)]")}>
                          {fmtRaw(row.commercialLong)}
                        </td>
                        {/* Commercial Short */}
                        <td className={cn(dimCellCls, "border-b border-line")}>{fmtRaw(row.commercialShort)}</td>
                        {/* Commercial Net — heat-map background is per-row computed data, stays inline */}
                        <td
                          className={cn(cellCls, "text-right border-b border-line font-semibold text-ink-strong border-r border-r-[rgba(248,185,61,0.15)]")}
                          style={{ background: ranges ? heatBg(row.commercialNet, ranges.cMin, ranges.cMax) : undefined }}
                        >
                          {fmtNet(row.commercialNet)}
                        </td>

                        {/* Small Spec — conditional */}
                        {showSmallSpec && (
                          <>
                            <td className={cn(dimCellCls, "border-b border-line border-l border-l-line")}>
                              {fmtRaw(row.smallSpecLong)}
                            </td>
                            <td className={cn(dimCellCls, "border-b border-line")}>{fmtRaw(row.smallSpecShort)}</td>
                            <td
                              className={cn(cellCls, "text-right border-b border-line font-normal text-ink-mid")}
                              style={{ background: ranges ? heatBg(row.smallSpecNet, ranges.ssMin, ranges.ssMax) : undefined }}
                            >
                              {fmtNet(row.smallSpecNet)}
                            </td>
                          </>
                        )}

                        {/* Index bar */}
                        <td className={cn(cellCls, "border-b border-line font-sans border-l border-l-line")}>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded overflow-hidden bg-track">
                              <div
                                className={cn("h-full rounded", row.largeSpecNet >= 0 ? "bg-teal" : "bg-coral")}
                                style={{ width: `${rangeIdx}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-ink-dim min-w-[24px] text-right">
                              {rangeIdx}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Load more (inside the rounded panel, below the table) ── */}
          {!loading && rows.length > 0 && rows.length < total && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-line">
              <span className="text-[12px] text-ink-dim">
                Showing {rows.length} of {total.toLocaleString()} weeks ·{" "}
                {fmtDateShort(rows[rows.length - 1].date)} – {fmtDateShort(rows[0].date)}
              </span>
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-semibold transition-all active:scale-95 disabled:opacity-60 bg-panel-2 border border-line text-ink-mid"
              >
                <Icon
                  name="refresh"
                  size={14}
                  className={cn(loadingMore && "animate-[spin_0.7s_linear_infinite]")}
                />
                {loadingMore ? "Loading…" : `Load ${Math.min(104, total - rows.length)} older weeks`}
              </button>
            </div>
          )}

          {/* Footer when all loaded */}
          {!loading && rows.length > 0 && rows.length >= total && (
            <div className="px-5 py-3 text-[12px] text-center border-t border-line text-ink-dim">
              All {total.toLocaleString()} weeks shown ·{" "}
              {fmtDateShort(rows[rows.length - 1].date)} – {fmtDateShort(rows[0].date)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
