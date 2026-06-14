"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon, Ring, Skeleton } from "@/components/ui";
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

  const sig = data ? SIGNAL_CFG[data.signal] : SIGNAL_CFG.neutral;

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
        {data && (
          <div className="flex items-center gap-5 shrink-0">
            {/* COT Index ring */}
            <div className="flex flex-col items-center gap-1">
              <Ring value={data.cotIndex} size={56} stroke={6} color={sig.color}>
                <span className="font-display font-bold text-[14px]" style={{ color: sig.color }}>
                  {data.cotIndex}
                </span>
              </Ring>
              <span className="text-[10.5px]" style={{ color: "var(--ink-dim)" }}>COT Index</span>
            </div>

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
          </div>

          {loading ? (
            <TableSkeleton />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 680 }}>
                <thead>
                  {/* Single sticky row — column headers only, at topbar bottom */}
                  <tr>
                    {[
                      { label: "Week Ending",    align: "left"  as const, w: 130 },
                      { label: "Large Spec Net", align: "right" as const, w: 145 },
                      { label: "WoW Δ",          align: "right" as const, w: 105 },
                      { label: "Commercial Net", align: "right" as const, w: 145 },
                      { label: "Small Spec Net", align: "right" as const, w: 135 },
                      { label: "Index",          align: "left"  as const, w: 120 },
                    ].map((col) => (
                      <th
                        key={col.label}
                        style={{
                          position: "sticky",
                          top: 60,
                          zIndex: 10,
                          width:      col.w,
                          padding:    "9px 16px",
                          textAlign:  col.align,
                          fontSize:   10.5,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                          color: "var(--ink-dim)",
                          whiteSpace: "nowrap",
                          background: "var(--panel)",
                          borderBottom: "2px solid var(--line)",
                        }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const prev    = rows[i + 1];
                    const wow     = prev ? row.largeSpecNet - prev.largeSpecNet : null;
                    const isLatest = i === 0;

                    // Position within the displayed window
                    const rangeIdx = ranges && ranges.lsMax !== ranges.lsMin
                      ? Math.round(Math.max(0, Math.min(100,
                          ((row.largeSpecNet - ranges.lsMin) / (ranges.lsMax - ranges.lsMin)) * 100
                        )))
                      : 50;

                    const cellBase: React.CSSProperties = {
                      padding: "9px 16px",
                      borderBottom: "1px solid var(--line)",
                      fontFamily: "var(--mono)",
                      fontFeatureSettings: '"tnum"',
                      whiteSpace: "nowrap",
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
                            fontSize: 12.5,
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

                        {/* Large Spec Net — primary heat map */}
                        <td
                          style={{
                            ...cellBase,
                            textAlign: "right",
                            background: ranges ? heatBg(row.largeSpecNet, ranges.lsMin, ranges.lsMax) : undefined,
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--ink-strong)",
                          }}
                        >
                          {fmtNet(row.largeSpecNet)}
                        </td>

                        {/* WoW Δ */}
                        <td
                          style={{
                            ...cellBase,
                            textAlign: "right",
                            background: ranges && wow !== null
                              ? heatBg(wow, ranges.wowMin, ranges.wowMax)
                              : undefined,
                            fontSize: 12.5,
                            fontWeight: 500,
                            color: "var(--ink-strong)",
                          }}
                        >
                          {wow !== null ? fmtNet(wow) : "—"}
                        </td>

                        {/* Commercial Net */}
                        <td
                          style={{
                            ...cellBase,
                            textAlign: "right",
                            background: ranges ? heatBg(row.commercialNet, ranges.cMin, ranges.cMax) : undefined,
                            fontSize: 12.5,
                            fontWeight: 500,
                            color: "var(--ink-strong)",
                          }}
                        >
                          {fmtNet(row.commercialNet)}
                        </td>

                        {/* Small Spec Net */}
                        <td
                          style={{
                            ...cellBase,
                            textAlign: "right",
                            background: ranges ? heatBg(row.smallSpecNet, ranges.ssMin, ranges.ssMax) : undefined,
                            fontSize: 12.5,
                            fontWeight: 400,
                            color: "var(--ink-mid)",
                          }}
                        >
                          {fmtNet(row.smallSpecNet)}
                        </td>

                        {/* Index bar */}
                        <td style={{ ...cellBase, fontFamily: "inherit" }}>
                          <div className="flex items-center gap-2.5">
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
                                minWidth: 26,
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
                {fmtDateShort(rows[rows.length - 1].date)} — {fmtDateShort(rows[0].date)}
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
              {fmtDateShort(rows[rows.length - 1].date)} — {fmtDateShort(rows[0].date)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
