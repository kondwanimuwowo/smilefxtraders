"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon, Skeleton } from "@/components/ui";
import { CotIndexDisplay } from "@/components/cot/CotIndexDisplay";
import type { CotSignal } from "@/app/api/cot/route";
import type { CotDetailRow, CotDetailResponse } from "@/app/api/cot/[pair]/route";

// ── Signal config ─────────────────────────────────────────────────────────────

const SIGNAL_CFG: Record<CotSignal, { label: string; color: string; bg: string; icon: string }> = {
  strong_bull: { label: "Strong Bullish Setup", color: "var(--teal-bright)",  bg: "rgba(48,232,223,0.12)",  icon: "trending_up"    },
  bull:        { label: "Bullish Bias",          color: "var(--teal)",         bg: "rgba(8,174,170,0.10)",   icon: "arrow_upward"   },
  neutral:     { label: "Neutral / Mixed",       color: "var(--gold)",         bg: "rgba(248,185,61,0.10)",  icon: "remove"         },
  bear:        { label: "Bearish Bias",          color: "var(--coral)",        bg: "rgba(234,82,61,0.10)",   icon: "arrow_downward" },
  strong_bear: { label: "Strong Bearish Setup",  color: "var(--coral-bright)", bg: "rgba(255,89,66,0.12)",   icon: "trending_down"  },
};

// ── Heat map ──────────────────────────────────────────────────────────────────

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

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cot/${pair}?offset=0`)
      .then((r) => {
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
      .catch(() => { setError(true); setLoading(false); });
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

  const sig = data ? SIGNAL_CFG[data.signal] : SIGNAL_CFG.neutral;
  const [showSmallSpec, setShowSmallSpec] = useState(false);

  return (
    <div className="view">

      {/* ── Back link ── */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1.5 mb-5 text-[13px] font-semibold transition-colors hover:opacity-80 active:scale-95"
        style={{ color: "var(--ink-dim)" }}
      >
        <Icon name="arrow_back" size={16} />
        COT Reports
      </button>

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1
              className="font-display font-bold"
              style={{ fontSize: 28, letterSpacing: "-0.025em", color: "var(--ink-strong)" }}
            >
              {pair.toUpperCase()}
            </h1>
            {data && (
              <>
                <span className="text-[15px]" style={{ color: "var(--ink-dim)" }}>·</span>
                <span className="text-[16px]" style={{ color: "var(--ink-mid)" }}>{data.label}</span>
                <span
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1 rounded-full"
                  style={{ background: sig.bg, color: sig.color }}
                >
                  <Icon name={sig.icon} size={13} />
                  {sig.label}
                </span>
                {data.usdBase && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded"
                    style={{ background: "var(--panel-2)", color: "var(--ink-dim)", border: "1px solid var(--line)" }}
                  >
                    USD-base · inverted
                  </span>
                )}
              </>
            )}
          </div>
          {data && (
            <p className="text-[13px]" style={{ color: "var(--ink-dim)" }}>
              CFTC report week ending {data.reportDate} · {total.toLocaleString()} weeks in database
            </p>
          )}
        </div>

        {/* Current reading summary */}
        {data && rows.length > 0 && (
          <div className="flex items-center gap-5 shrink-0">
            {/* COT Index — compact */}
            <CotIndexDisplay
              rows={rows}
              cotIndex={data.cotIndex}
              signal={data.signal}
              pair={pair.toUpperCase()}
              totalWeeks={data.totalWeeks}
              compact
            />

            {/* WoW change */}
            <div className="text-right">
              <div
                className="font-display font-bold tabular-nums text-[22px]"
                style={{ color: data.wowChange >= 0 ? "var(--teal-bright)" : "var(--coral-bright)", letterSpacing: "-0.02em" }}
              >
                {fmtNet(data.wowChange)}
              </div>
              <div className="text-[11px]" style={{ color: "var(--ink-dim)" }}>WoW change</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Full COT Index display — three-range comparison + interpretation ── */}
      {!error && !loading && data && rows.length > 0 && (
        <div className="mb-6">
          <CotIndexDisplay
            rows={rows}
            cotIndex={data.cotIndex}
            signal={data.signal}
            pair={pair.toUpperCase()}
            totalWeeks={data.totalWeeks}
          />
        </div>
      )}

      {/* ── Error state ── */}
      {error && (
        <div
          className="rounded-2xl px-5 py-4 text-[13px]"
          style={{ background: "rgba(234,82,61,0.07)", border: "1px solid rgba(234,82,61,0.2)", color: "var(--coral)" }}
        >
          Pair not found or data unavailable. <button onClick={() => router.back()} className="underline">Go back</button>
        </div>
      )}

      {/* ── Heat map table ──
           Outer container has NO overflow-hidden — that would trap sticky positioning.
           Rounded corners come from the border-radius on the container border alone.  ── */}
      {!error && (
        <div
          className="rounded-2xl"
          style={{ border: "1px solid var(--line)", background: "var(--panel)" }}
        >
          {/* Color key — static, not sticky. You read it once at the top. */}
          <div
            className="flex items-center gap-5 px-5 py-3 text-[11.5px] flex-wrap"
            style={{ borderBottom: "1px solid var(--line)", color: "var(--ink-dim)" }}
          >
            <span className="font-semibold" style={{ color: "var(--ink-mid)" }}>Color key</span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "rgba(8,174,170,0.65)" }} />
              Net long / increasing
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "rgba(234,82,61,0.65)" }} />
              Net short / decreasing
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "var(--track)" }} />
              Near zero
            </span>
            <span className="flex items-center gap-1.5 ml-auto" style={{ opacity: 0.65 }}>
              <Icon name="info" size={12} />
              Index = position within displayed range
            </span>
            <button
              type="button"
              onClick={() => setShowSmallSpec((v) => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all active:scale-95"
              style={{
                background: showSmallSpec ? "rgba(8,174,170,0.12)" : "var(--panel-2)",
                color:      showSmallSpec ? "var(--teal)" : "var(--ink-dim)",
                border:     `1px solid ${showSmallSpec ? "rgba(8,174,170,0.3)" : "var(--line)"}`,
              }}
            >
              <Icon name={showSmallSpec ? "visibility" : "visibility_off"} size={12} />
              Retail
            </button>
          </div>

          {loading ? (
            <TableSkeleton />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: showSmallSpec ? 1020 : 780 }}>
                <thead>
                  {/* Group row */}
                  <tr>
                    <th
                      rowSpan={2}
                      style={{
                        width: 130, padding: "8px 16px",
                        textAlign: "left", fontSize: 10.5, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.07em",
                        color: "var(--ink-dim)", whiteSpace: "nowrap",
                        background: "var(--panel)", borderBottom: "1px solid var(--line)",
                      }}
                    >
                      Week Ending
                    </th>
                    {/* Large Spec group — colspan 4: Long, Short, Net, % Long */}
                    <th
                      colSpan={4}
                      style={{
                        padding: "7px 16px 5px",
                        textAlign: "center", fontSize: 10, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.07em",
                        color: "var(--teal)", whiteSpace: "nowrap",
                        background: "rgba(8,174,170,0.05)",
                        borderBottom: "1px solid var(--line)",
                        borderLeft: "1px solid rgba(8,174,170,0.2)",
                        borderRight: "1px solid rgba(8,174,170,0.2)",
                      }}
                    >
                      Large Spec
                    </th>
                    {/* WoW Δ */}
                    <th
                      rowSpan={2}
                      style={{
                        width: 88, padding: "8px 14px",
                        textAlign: "right", fontSize: 10.5, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.07em",
                        color: "var(--ink-dim)", whiteSpace: "nowrap",
                        background: "var(--panel)", borderBottom: "1px solid var(--line)",
                      }}
                    >
                      WoW Δ
                    </th>
                    {/* Commercial group */}
                    <th
                      colSpan={3}
                      style={{
                        padding: "7px 16px 5px",
                        textAlign: "center", fontSize: 10, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.07em",
                        color: "var(--gold)", whiteSpace: "nowrap",
                        background: "rgba(248,185,61,0.05)",
                        borderBottom: "1px solid var(--line)",
                        borderLeft: "1px solid rgba(248,185,61,0.2)",
                        borderRight: "1px solid rgba(248,185,61,0.2)",
                      }}
                    >
                      Commercial
                    </th>
                    {/* Small Spec group — conditional */}
                    {showSmallSpec && (
                      <th
                        colSpan={3}
                        style={{
                          padding: "7px 16px 5px",
                          textAlign: "center", fontSize: 10, fontWeight: 700,
                          textTransform: "uppercase", letterSpacing: "0.07em",
                          color: "var(--ink-mid)", whiteSpace: "nowrap",
                          background: "var(--panel)",
                          borderBottom: "1px solid var(--line)",
                          borderLeft: "1px solid var(--line)",
                        }}
                      >
                        Retail
                      </th>
                    )}
                    {/* Index */}
                    <th
                      rowSpan={2}
                      style={{
                        width: 110, padding: "8px 16px",
                        textAlign: "left", fontSize: 10.5, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.07em",
                        color: "var(--ink-dim)", whiteSpace: "nowrap",
                        background: "var(--panel)", borderBottom: "1px solid var(--line)",
                        borderLeft: "1px solid var(--line)",
                      }}
                    >
                      Index
                    </th>
                  </tr>
                  {/* Sub-header row */}
                  <tr>
                    {/* Large Spec sub-cols: Long, Short, Net, % Long */}
                    {(["Long", "Short", "Net", "% Long"] as const).map((label, idx) => (
                      <th
                        key={`ls-${label}`}
                        style={{
                          padding: "5px 14px 8px",
                          textAlign: "right", fontSize: 9.5, fontWeight: 600,
                          textTransform: "uppercase", letterSpacing: "0.06em",
                          color: label === "Net" || label === "% Long" ? "var(--teal)" : "var(--ink-dim)",
                          whiteSpace: "nowrap",
                          background: "rgba(8,174,170,0.05)",
                          borderBottom: "2px solid var(--line)",
                          borderLeft: idx === 0 ? "1px solid rgba(8,174,170,0.2)" : undefined,
                          borderRight: idx === 3 ? "1px solid rgba(8,174,170,0.2)" : undefined,
                        }}
                      >
                        {label}
                      </th>
                    ))}
                    {/* Commercial sub-cols */}
                    {(["Long", "Short", "Net"] as const).map((label, idx) => (
                      <th
                        key={`c-${label}`}
                        style={{
                          padding: "5px 14px 8px",
                          textAlign: "right", fontSize: 9.5, fontWeight: 600,
                          textTransform: "uppercase", letterSpacing: "0.06em",
                          color: label === "Net" ? "var(--gold)" : "var(--ink-dim)",
                          whiteSpace: "nowrap",
                          background: "rgba(248,185,61,0.05)",
                          borderBottom: "2px solid var(--line)",
                          borderLeft: idx === 0 ? "1px solid rgba(248,185,61,0.2)" : undefined,
                          borderRight: idx === 2 ? "1px solid rgba(248,185,61,0.2)" : undefined,
                        }}
                      >
                        {label}
                      </th>
                    ))}
                    {/* Small Spec sub-cols — conditional */}
                    {showSmallSpec && (["Long", "Short", "Net"] as const).map((label, idx) => (
                      <th
                        key={`ss-${label}`}
                        style={{
                          padding: "5px 14px 8px",
                          textAlign: "right", fontSize: 9.5, fontWeight: 600,
                          textTransform: "uppercase", letterSpacing: "0.06em",
                          color: label === "Net" ? "var(--ink-mid)" : "var(--ink-dim)",
                          whiteSpace: "nowrap",
                          background: "var(--panel)",
                          borderBottom: "2px solid var(--line)",
                          borderLeft: idx === 0 ? "1px solid var(--line)" : undefined,
                        }}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* 13-week average — pinned reference row */}
                  {avg13 && (() => {
                    const avgCell: React.CSSProperties = {
                      padding: "8px 14px",
                      borderBottom: "2px solid var(--line)",
                      fontFamily: "var(--mono)",
                      fontFeatureSettings: '"tnum"',
                      whiteSpace: "nowrap",
                      fontSize: 11.5,
                      textAlign: "right",
                      color: "var(--ink-dim)",
                      fontWeight: 500,
                    };
                    const deltaLS = rows[0] ? rows[0].largeSpecNet - avg13.largeSpecNet : 0;
                    return (
                      <tr style={{ background: "rgba(8,174,170,0.025)" }}>
                        <td style={{ ...avgCell, textAlign: "left", fontFamily: "inherit", color: "var(--teal)", fontWeight: 700 }}>
                          <span className="flex items-center gap-2">
                            13W Avg
                            <span
                              className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded"
                              style={{
                                background: "var(--panel-2)",
                                color: deltaLS >= 0 ? "var(--teal-bright)" : "var(--coral-bright)",
                                fontFamily: "var(--mono)",
                              }}
                            >
                              now {fmtNet(deltaLS)} vs avg
                            </span>
                          </span>
                        </td>
                        <td style={{ ...avgCell, borderLeft: "1px solid rgba(8,174,170,0.15)" }}>{fmtRaw(avg13.largeSpecLong)}</td>
                        <td style={avgCell}>{fmtRaw(avg13.largeSpecShort)}</td>
                        <td style={{ ...avgCell, fontWeight: 700, color: "var(--ink-mid)" }}>{fmtNet(avg13.largeSpecNet)}</td>
                        <td style={{ ...avgCell, borderRight: "1px solid rgba(8,174,170,0.15)" }}>
                          {avg13.pctLong != null ? `${avg13.pctLong}%` : "—"}
                        </td>
                        <td style={{ ...avgCell, fontWeight: 600, color: "var(--ink-mid)" }}>
                          {avg13.avgWow != null ? fmtNet(avg13.avgWow) : "—"}
                        </td>
                        <td style={{ ...avgCell, borderLeft: "1px solid rgba(248,185,61,0.15)" }}>{fmtRaw(avg13.commercialLong)}</td>
                        <td style={avgCell}>{fmtRaw(avg13.commercialShort)}</td>
                        <td style={{ ...avgCell, fontWeight: 600, color: "var(--ink-mid)", borderRight: "1px solid rgba(248,185,61,0.15)" }}>
                          {fmtNet(avg13.commercialNet)}
                        </td>
                        {showSmallSpec && (
                          <>
                            <td style={{ ...avgCell, borderLeft: "1px solid var(--line)" }}>{fmtRaw(avg13.smallSpecLong)}</td>
                            <td style={avgCell}>{fmtRaw(avg13.smallSpecShort)}</td>
                            <td style={avgCell}>{fmtNet(avg13.smallSpecNet)}</td>
                          </>
                        )}
                        <td style={{ ...avgCell, borderLeft: "1px solid var(--line)" }}>—</td>
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

                    const cellBase: React.CSSProperties = {
                      padding: "8px 14px",
                      borderBottom: "1px solid var(--line)",
                      fontFamily: "var(--mono)",
                      fontFeatureSettings: '"tnum"',
                      whiteSpace: "nowrap",
                      fontSize: 12,
                    };

                    const dimCell: React.CSSProperties = {
                      ...cellBase,
                      textAlign: "right",
                      color: "var(--ink-dim)",
                      fontWeight: 400,
                    };

                    return (
                      <tr
                        key={row.date}
                        style={{ background: isLatest ? "rgba(8,174,170,0.035)" : undefined }}
                      >
                        {/* Date */}
                        <td
                          style={{
                            ...cellBase,
                            fontFamily: "inherit",
                            color: isLatest ? "var(--ink-strong)" : "var(--ink-dim)",
                            fontWeight: isLatest ? 600 : 400,
                          }}
                        >
                          <span className="flex items-center gap-2">
                            {fmtDateShort(row.date)}
                            {isLatest && (
                              <span
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                style={{ background: "rgba(8,174,170,0.15)", color: "var(--teal)", fontFamily: "inherit" }}
                              >
                                Latest
                              </span>
                            )}
                          </span>
                        </td>

                        {/* Large Spec Long */}
                        <td style={{ ...dimCell, borderLeft: "1px solid rgba(8,174,170,0.15)" }}>
                          {fmtRaw(row.largeSpecLong)}
                        </td>
                        {/* Large Spec Short */}
                        <td style={dimCell}>{fmtRaw(row.largeSpecShort)}</td>
                        {/* Large Spec Net */}
                        <td
                          style={{
                            ...cellBase,
                            textAlign: "right",
                            background: ranges ? heatBg(row.largeSpecNet, ranges.lsMin, ranges.lsMax) : undefined,
                            fontWeight: 700,
                            color: "var(--ink-strong)",
                          }}
                        >
                          {fmtNet(row.largeSpecNet)}
                        </td>
                        {/* % Long — longs as % of total LS open interest */}
                        {(() => {
                          const total = (row.largeSpecLong ?? 0) + (row.largeSpecShort ?? 0);
                          const pct   = total > 0 && row.largeSpecLong != null
                            ? Math.round((row.largeSpecLong / total) * 100)
                            : null;
                          const color = pct == null ? "var(--ink-dim)"
                            : pct >= 60 ? "var(--teal-bright)"
                            : pct <= 40 ? "var(--coral-bright)"
                            : "var(--ink-mid)";
                          return (
                            <td style={{ ...cellBase, textAlign: "right", fontWeight: 600, color, borderRight: "1px solid rgba(8,174,170,0.15)" }}>
                              {pct != null ? `${pct}%` : "—"}
                            </td>
                          );
                        })()}

                        {/* WoW Δ */}
                        <td
                          style={{
                            ...cellBase,
                            textAlign: "right",
                            background: ranges && wow !== null
                              ? heatBg(wow, ranges.wowMin, ranges.wowMax)
                              : undefined,
                            fontWeight: 500,
                            color: "var(--ink-strong)",
                          }}
                        >
                          {wow !== null ? fmtNet(wow) : "—"}
                        </td>

                        {/* Commercial Long */}
                        <td style={{ ...dimCell, borderLeft: "1px solid rgba(248,185,61,0.15)" }}>
                          {fmtRaw(row.commercialLong)}
                        </td>
                        {/* Commercial Short */}
                        <td style={dimCell}>{fmtRaw(row.commercialShort)}</td>
                        {/* Commercial Net */}
                        <td
                          style={{
                            ...cellBase,
                            textAlign: "right",
                            background: ranges ? heatBg(row.commercialNet, ranges.cMin, ranges.cMax) : undefined,
                            fontWeight: 600,
                            color: "var(--ink-strong)",
                            borderRight: "1px solid rgba(248,185,61,0.15)",
                          }}
                        >
                          {fmtNet(row.commercialNet)}
                        </td>

                        {/* Small Spec — conditional */}
                        {showSmallSpec && (
                          <>
                            <td style={{ ...dimCell, borderLeft: "1px solid var(--line)" }}>
                              {fmtRaw(row.smallSpecLong)}
                            </td>
                            <td style={dimCell}>{fmtRaw(row.smallSpecShort)}</td>
                            <td
                              style={{
                                ...cellBase,
                                textAlign: "right",
                                background: ranges ? heatBg(row.smallSpecNet, ranges.ssMin, ranges.ssMax) : undefined,
                                fontWeight: 400,
                                color: "var(--ink-mid)",
                              }}
                            >
                              {fmtNet(row.smallSpecNet)}
                            </td>
                          </>
                        )}

                        {/* Index bar */}
                        <td style={{ ...cellBase, fontFamily: "inherit", borderLeft: "1px solid var(--line)" }}>
                          <div className="flex items-center gap-2">
                            <div
                              style={{
                                flex: 1,
                                height: 6,
                                borderRadius: 4,
                                background: "var(--track)",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width: `${rangeIdx}%`,
                                  background: row.largeSpecNet >= 0 ? "var(--teal)" : "var(--coral)",
                                  borderRadius: 4,
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontFamily: "var(--mono)",
                                fontSize: 11,
                                color: "var(--ink-dim)",
                                minWidth: 24,
                                textAlign: "right",
                              }}
                            >
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
            <div
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderTop: "1px solid var(--line)" }}
            >
              <span className="text-[12px]" style={{ color: "var(--ink-dim)" }}>
                Showing {rows.length} of {total.toLocaleString()} weeks ·{" "}
                {fmtDateShort(rows[rows.length - 1].date)} – {fmtDateShort(rows[0].date)}
              </span>
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-semibold transition-all active:scale-95 disabled:opacity-60"
                style={{ background: "var(--panel-2)", border: "1px solid var(--line)", color: "var(--ink-mid)" }}
              >
                <Icon
                  name="refresh"
                  size={14}
                  style={{ animation: loadingMore ? "spin 0.7s linear infinite" : "none" }}
                />
                {loadingMore ? "Loading…" : `Load ${Math.min(104, total - rows.length)} older weeks`}
              </button>
            </div>
          )}

          {/* Footer when all loaded */}
          {!loading && rows.length > 0 && rows.length >= total && (
            <div
              className="px-5 py-3 text-[12px] text-center"
              style={{ borderTop: "1px solid var(--line)", color: "var(--ink-dim)" }}
            >
              All {total.toLocaleString()} weeks shown ·{" "}
              {fmtDateShort(rows[rows.length - 1].date)} – {fmtDateShort(rows[0].date)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
