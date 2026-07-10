"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Panel, PanelHead, Sparkline, Skeleton, Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { CotIndexDisplay } from "@/components/cot/CotIndexDisplay";
import { CotLockScreen } from "@/components/cot/CotLockScreen";
import { SIGNAL_CFG } from "@/components/cot/signalCfg";
import { buildCotCommentary } from "@/lib/cot/commentary";
import type { CotEntry } from "@/lib/cot/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 1): string {
  const abs  = Math.abs(n);
  const sign = n >= 0 ? "+" : "−";
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(decimals)}M`;
  if (abs >= 1_000)     return `${sign}${(abs / 1_000).toFixed(decimals)}K`;
  return `${sign}${abs}`;
}

function fmtAbs(n: number, decimals = 1): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(decimals)}M`;
  if (abs >= 1_000)     return `${(abs / 1_000).toFixed(decimals)}K`;
  return String(abs);
}

function fmtDate(iso: string): string {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Position bar (centred, extends left or right from midpoint) ───────────────

function PositionBar({ value, max, barCls }: { value: number; max: number; barCls: string }) {
  const pct     = Math.min(Math.abs(value) / (max || 1) * 100, 100);
  const negative = value < 0;
  return (
    <div className="relative h-1.5 rounded-full overflow-hidden bg-track">
      <div
        className={cn("absolute top-0 h-full rounded-full transition-[width] duration-700 ease-app", barCls)}
        style={{
          width: `${pct / 2}%`,
          left:  negative ? undefined : "50%",
          right: negative ? "50%" : undefined,
        }}
      />
      <div className="absolute inset-y-0 left-1/2 w-px bg-line" />
    </div>
  );
}

// ── Divergence panel ──────────────────────────────────────────────────────────
// Text comes from the shared commentary engine (lib/cot/commentary) — the
// detail page renders the same flow + structure sentences, so the card and
// the page never disagree.

const TONE_CLS = {
  bull:    { textCls: "text-teal",  bgCls: "bg-[rgba(8,174,170,0.06)]",  borderCls: "border-[rgba(8,174,170,0.2)]"  },
  bear:    { textCls: "text-coral", bgCls: "bg-[rgba(234,82,61,0.06)]",  borderCls: "border-[rgba(234,82,61,0.2)]"  },
  caution: { textCls: "text-gold",  bgCls: "bg-[rgba(248,185,61,0.06)]", borderCls: "border-[rgba(248,185,61,0.2)]" },
} as const;

function DivergencePanel({ entry }: { entry: CotEntry }) {
  const { history } = entry;
  const commentary = buildCotCommentary({
    pair:           entry.pair,
    divergenceType: entry.divergenceType,
    wowChange:      entry.wowChange,
    lsChange:       history[0].largeSpecNet  - (history[1]?.largeSpecNet  ?? history[0].largeSpecNet),
    cChange:        history[0].commercialNet - (history[1]?.commercialNet ?? history[0].commercialNet),
    cotIndex:       entry.cotIndex,
    cotIndex52w:    entry.cotIndex52w,
    cotIndexAll:    entry.cotIndexAll,
    signal:         entry.signal,
    largeSpecNet:   history[0].largeSpecNet,
    openInterest:   entry.openInterest,
    grossHistory:   history.slice(0, 6).map((w) => ({ long: w.largeSpecLong, short: w.largeSpecShort })),
    inverted:       entry.usdBase,
  });
  const cls = TONE_CLS[commentary.tone];

  return (
    <div className={cn("mx-5 mb-4 rounded-xl px-4 py-3 flex items-start gap-2.5 border", cls.bgCls, cls.borderCls)}>
      <Icon name={commentary.icon} size={15} fill className={cn("shrink-0 mt-px", cls.textCls)} />
      <div>
        <div className={cn("text-[12px] font-semibold mb-0.5", cls.textCls)}>{commentary.title}</div>
        <p className="text-[12px] leading-relaxed text-ink-dim">{commentary.flow} {commentary.structure}</p>
      </div>
    </div>
  );
}

// ── History table ─────────────────────────────────────────────────────────────

function HistoryTable({ history }: { history: CotEntry["history"] }) {
  const rows = history.slice(0, 4);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11.5px] border-collapse">
        <thead>
          <tr className="border-b border-line">
            {["Date", "Large Spec", "Commercials", "Small Spec", "WoW Chg"].map((h) => (
              <th key={h} className="text-left py-2 px-3 font-semibold tabular-nums whitespace-nowrap text-ink-dim">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((w, i) => {
            const prev = rows[i + 1];
            const chg  = prev ? w.largeSpecNet - prev.largeSpecNet : null;
            return (
              <tr key={w.date} className={i < rows.length - 1 ? "border-b border-line" : ""}>
                <td className="py-2 px-3 tabular-nums whitespace-nowrap text-ink-mid">
                  {fmtDate(w.date)}
                </td>
                <td className={cn("py-2 px-3 tabular-nums font-medium", w.largeSpecNet >= 0 ? "text-teal-bright" : "text-coral-bright")}>
                  {fmt(w.largeSpecNet)}
                  {prev && (
                    <Icon name={w.largeSpecNet > prev.largeSpecNet ? "arrow_upward" : "arrow_downward"}
                      size={11} className="text-current ml-0.5 opacity-70" />
                  )}
                </td>
                <td className={cn("py-2 px-3 tabular-nums font-medium", w.commercialNet >= 0 ? "text-teal" : "text-coral")}>
                  {fmt(w.commercialNet)}
                </td>
                <td className="py-2 px-3 tabular-nums text-ink-dim">
                  {fmt(w.smallSpecNet)}
                </td>
                <td className={cn("py-2 px-3 tabular-nums font-semibold", chg === null ? "text-ink-dim" : chg >= 0 ? "text-teal-bright" : "text-coral-bright")}>
                  {chg === null ? "—" : fmt(chg)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── History depth badge ───────────────────────────────────────────────────────

function HistoryBadge({ weeks }: { weeks: number }) {
  const years = (weeks / 52).toFixed(0);
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-[rgba(8,174,170,0.08)] text-teal border border-[rgba(8,174,170,0.18)]">
      <Icon name="history" size={11} />
      {weeks > 52 ? `${years}yr history` : `${weeks}wk`}
    </span>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

function CotCard({ entry, onOpen }: { entry: CotEntry; onOpen: (pair: string) => void }) {
  const [histOpen, setHistOpen] = useState(false);

  // No DB data yet — render a placeholder card
  if (!entry.history.length) {
    return (
      <div className="rounded-2xl p-5 flex items-center gap-4 bg-panel border border-line">
        <div className="size-10 rounded-full flex items-center justify-center shrink-0 bg-panel-2">
          <Icon name="hourglass_empty" size={18} className="text-ink-dim" />
        </div>
        <div>
          <div className="font-display font-bold text-[15px] text-ink-strong">{entry.label}</div>
          <div className="text-[12px] mt-0.5 text-ink-dim">
            COT data not yet available. Check back after Friday&apos;s CFTC release.
          </div>
        </div>
      </div>
    );
  }

  const sig = SIGNAL_CFG[entry.signal];
  const cur = entry.history[0];
  const prev = entry.history[1] ?? entry.history[0];

  const maxPos = Math.max(
    Math.abs(cur.largeSpecNet),
    Math.abs(cur.commercialNet),
    Math.abs(cur.smallSpecNet),
    1
  );

  // Sparkline: reverse history so oldest is left (chronological)
  const sparkData = [...entry.history].reverse().map((w) => w.largeSpecNet);
  // Color based on net direction — are specs net long or net short?
  const sparkColor = cur.largeSpecNet >= 0 ? "var(--teal-bright)" : "var(--coral-bright)";

  return (
    // Outer wrapper is relative + no overflow clip so the floating dropdown can escape
    <div className="relative">
    <div
      className="rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-150 h-full bg-panel border border-line hover:border-teal"
      onClick={() => onOpen(entry.pair)}
      role="button"
      aria-label={`Open ${entry.pair} COT detail`}
    >
      {/* ── Card header ── */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-display font-bold text-[20px] tracking-[-0.02em] text-ink-strong">
              {entry.pair}
            </span>
            <span className="text-[11px] text-ink-dim">·</span>
            <span className="text-[13px] text-ink-mid">{entry.label}</span>
            {/* Signal badge */}
            <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full", sig.bgCls, sig.textCls)}>
              <Icon name={sig.icon} size={12} />
              {sig.label}
            </span>
            {entry.totalWeeks > 0 && <HistoryBadge weeks={entry.totalWeeks} />}
            {entry.usdBase && (
              <span
                title="Positions shown for the foreign currency futures (JPY/CHF/CAD). Net positive = bullish on the USD pair."
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded cursor-help bg-panel-2 text-ink-dim border border-line"
              >
                USD-base · inverted
              </span>
            )}
          </div>
          <div className="text-[12px] text-ink-dim">
            CFTC report week ending {entry.reportDate}
          </div>
        </div>

        {/* WoW change + overview link */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="text-right">
            <div className={cn("font-display font-bold tabular-nums text-[18px] tracking-[-0.01em]", entry.wowChange >= 0 ? "text-teal-bright" : "text-coral-bright")}>
              {fmt(entry.wowChange)}
            </div>
            <div className="text-[11px] text-ink-dim">WoW change</div>
            {entry.openInterest != null && entry.openInterest > 0 && (
              <div className="text-[10.5px] tabular-nums mt-0.5 text-ink-dim">
                OI {fmtAbs(entry.openInterest)} · net{" "}
                <span className={cur.largeSpecNet >= 0 ? "text-teal" : "text-coral"}>
                  {Math.round((cur.largeSpecNet / entry.openInterest) * 100)}%
                </span>{" "}
                of OI
              </div>
            )}
          </div>
          <Link
            href={`/pair/${entry.pair}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[11px] font-semibold transition-colors hover:opacity-80 text-teal"
          >
            Overview <Icon name="open_in_new" size={11} />
          </Link>
        </div>
      </div>

      {/* ── COT Index + Position bars + Sparkline ── */}
      <div className="px-5 pb-4 grid gap-5 grid-cols-[auto_1fr_auto]">

        {/* COT Index — compact display with zone label + lookback */}
        <CotIndexDisplay
          rows={entry.history}
          cotIndex={entry.cotIndex}
          totalWeeks={entry.totalWeeks}
          compact
        />

        {/* Position breakdown */}
        <div className="flex flex-col justify-center gap-3.5">
          {[
            { label: "Large Speculators", sub: "Smart Money: institutions", value: cur.largeSpecNet,  prev: prev.largeSpecNet,  colorCls: cur.largeSpecNet  >= 0 ? "text-teal" : "text-coral", barCls: cur.largeSpecNet  >= 0 ? "bg-teal" : "bg-coral" },
            { label: "Commercials",       sub: "Hedgers: contrarian signal", value: cur.commercialNet, prev: prev.commercialNet, colorCls: cur.commercialNet >= 0 ? "text-teal" : "text-coral", barCls: cur.commercialNet >= 0 ? "bg-teal" : "bg-coral" },
            { label: "Small Speculators", sub: "Retail: fade at extremes",   value: cur.smallSpecNet,  prev: prev.smallSpecNet,  colorCls: "text-ink-dim", barCls: "bg-ink-dim" },
          ].map(({ label, sub, value, prev: p, colorCls, barCls }) => {
            const chg = value - p;
            return (
              <div key={label}>
                <div className="flex items-start justify-between mb-1.5 gap-2">
                  <div>
                    <div className="text-[11.5px] font-semibold leading-tight text-ink-mid">{label}</div>
                    <div className="text-[10.5px] leading-tight text-ink-dim">{sub}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={cn("font-semibold tabular-nums text-[13px]", colorCls)}>
                      {fmt(value)}
                    </div>
                    <div className={cn("text-[10px] tabular-nums", chg >= 0 ? "text-teal-bright" : "text-coral-bright")}>
                      {fmt(chg)} WoW
                    </div>
                  </div>
                </div>
                <PositionBar value={value} max={maxPos} barCls={barCls} />
              </div>
            );
          })}
        </div>

        {/* 8-week sparkline */}
        <div className="flex flex-col items-center justify-center gap-1.5 min-w-[100px]">
          <div className="text-[10px] font-semibold text-center mb-0.5 text-ink-dim">
            Large Spec · 8W
          </div>
          <Sparkline data={sparkData} width={100} height={48} color={sparkColor} strokeW={1.5} />
          <div className="w-full flex justify-between text-[10px] tabular-nums text-ink-dim">
            <span>{fmtAbs(Math.min(...sparkData))}</span>
            <span>{fmtAbs(Math.max(...sparkData))}</span>
          </div>
          <div className="text-[10px] text-center text-ink-dim">
            {entry.history.length >= 8 ? "8 weeks" : `${entry.history.length} weeks`}
          </div>
        </div>
      </div>

      {/* ── Divergence analysis ── */}
      <DivergencePanel entry={entry} />

      {/* ── History table toggle (button only — inside card so it clips correctly) ── */}
      <div className="mt-auto border-t border-line" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setHistOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-2.5 text-[12px] font-semibold transition-colors hover:bg-hover text-ink-mid"
        >
          <span className="flex items-center gap-1.5">
            <Icon name="table_rows" size={14} />
            4-Week Position History
          </span>
          <Icon name={histOpen ? "expand_less" : "expand_more"} size={16} />
        </button>
      </div>
    </div>

    {/* Floating dropdown — sibling of the card so overflow-hidden doesn't clip it */}
    {histOpen && (
      <div
        className="absolute left-0 right-0 top-full z-20 px-2 pb-3 bg-panel border border-t-0 border-line rounded-b-2xl shadow-[0_12px_32px_rgba(0,0,0,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <HistoryTable history={entry.history} />
      </div>
    )}
    </div>
  );
}

// ── Summary strip ─────────────────────────────────────────────────────────────

function SummaryStrip({ entries }: { entries: CotEntry[] }) {
  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {entries.map((e) => {
        const sig = SIGNAL_CFG[e.signal];
        return (
          <div
            key={e.pair}
            className={cn("flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold border", sig.bgCls, sig.textCls, sig.borderCls)}
          >
            <Icon name={sig.icon} size={13} />
            <span className="text-ink-strong">{e.pair}</span>
            <span>{sig.shortLabel}</span>
            <span className="tabular-nums text-[11px] opacity-75">{e.cotIndex}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(min(520px,100%),1fr))]">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-5 flex flex-col gap-4 bg-panel border border-line">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <Skeleton h={22} w={120} r={6} />
              <Skeleton h={14} w={200} r={4} />
            </div>
            <Skeleton h={28} w={60} r={6} />
          </div>
          <div className="flex gap-4">
            <Skeleton h={72} w={72} r={999} />
            <div className="flex-1 flex flex-col gap-3">
              <Skeleton h={30} w="100%" r={6} />
              <Skeleton h={30} w="100%" r={6} />
              <Skeleton h={30} w="100%" r={6} />
            </div>
            <Skeleton h={72} w={100} r={6} />
          </div>
          <Skeleton h={52} w="100%" r={10} />
        </div>
      ))}
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function CotReports() {
  const router = useRouter();
  const [entries, setEntries]   = useState<CotEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [selected, setSelected] = useState("All");
  const [locked, setLocked]     = useState(false);

  function load() {
    fetch(`/api/cot?t=${Date.now()}`)
      .then(async (r) => {
        if (r.status === 403) { setLocked(true); setLoading(false); return; }
        const data = await r.json();
        setEntries(data);
        setLoading(false);
        setRetrying(false);
      })
      .catch(() => { setLoading(false); setRetrying(false); });
  }

  useEffect(() => { load(); }, []);

  function retry() {
    setRetrying(true);
    // POST to /api/cot/refresh to pull latest data from CFTC into the DB,
    // then re-read the DB so the cards show the new report.
    fetch("/api/cot/refresh", { method: "POST" })
      .then(() => load())
      .catch(() => { setRetrying(false); });
  }

  const pairs = useMemo(() => ["All", ...entries.map((e) => e.pair)], [entries]);

  const visible = useMemo(
    () => selected === "All" ? entries : entries.filter((e) => e.pair === selected),
    [entries, selected]
  );

  const loaded    = entries.filter((e) => e.totalWeeks > 0).length;
  const hasData   = loaded > 0;
  const allLoaded = loaded === entries.length && entries.length > 0;
  const lastDate  = entries.find((e) => e.totalWeeks > 0)?.reportDate ?? "—";
  const totalHistory = entries.reduce((s, e) => s + e.totalWeeks, 0);

  if (locked) return <CotLockScreen />;

  return (
    <div className="view">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-2 gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl tracking-[-0.02em] text-ink-strong">
            COT Reports
          </h1>
          <p className="text-[13px] mt-0.5 text-ink-dim">
            CFTC Commitments of Traders · Legacy Futures-Only · As of Tuesday, published Fridays ~15:30 ET
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Status badge */}
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] border",
              allLoaded ? "bg-[rgba(8,174,170,0.08)] border-[rgba(8,174,170,0.2)] text-teal"
                : hasData ? "bg-[rgba(248,185,61,0.08)] border-[rgba(248,185,61,0.2)] text-gold"
                  : "bg-panel-2 border-line text-ink-dim"
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                allLoaded ? "bg-teal" : hasData ? "bg-gold" : "bg-ink-dim",
                hasData && "animate-live"
              )}
            />
            {allLoaded
              ? `${lastDate} · ${(totalHistory / 52).toFixed(0)}yr avg history`
              : hasData
              ? `${loaded}/${entries.length} loaded · ${lastDate}`
              : "No COT data yet"}
          </div>

          {/* Refresh button */}
          {!loading && (
            <button
              type="button"
              onClick={retry}
              disabled={retrying}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all active:scale-95 disabled:opacity-60 bg-panel-2 border border-line text-ink-mid"
            >
              <Icon name="refresh" size={14} className={retrying ? "animate-[spin_0.7s_linear_infinite]" : undefined} />
              {retrying ? "Refreshing…" : "Refresh"}
            </button>
          )}
        </div>
      </div>

      {/* ── How to read COT (compact) ── */}
      <div className="mb-5 rounded-xl px-4 py-3 flex items-start gap-3 text-[12px] leading-relaxed bg-[rgba(248,185,61,0.05)] border border-[rgba(248,185,61,0.15)] text-ink-mid">
        <Icon name="school" size={15} fill className="text-gold shrink-0 mt-px" />
        <span>
          <strong className="text-ink-strong">Signal</strong> is driven by the Large Spec net position: net long = bullish bias, net short = bearish bias, confirmed by weekly momentum direction.{" "}
          <strong className="text-ink-strong">COT Index (0–100)</strong> shows where that positioning sits within its own 3-year range. Think of it as a cycle gauge, not the direction itself. Near 100 = historically max long (watch for exhaustion). Near 0 = historically max short (watch for reversal).{" "}
          <strong className="text-ink-strong">Divergence</strong> between large specs and commercials adds conviction: when both groups confirm the same direction, that&apos;s your SMC HTF bias.
        </span>
      </div>

      {/* ── Summary strip ── */}
      {!loading && entries.length > 0 && <SummaryStrip entries={entries} />}

      {/* ── Pair filter tabs ── */}
      {!loading && (
        <div className="flex items-center gap-1.5 mb-5 flex-wrap">
          {pairs.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setSelected(p)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all active:scale-95",
                selected === p ? "bg-teal text-white" : "bg-panel-2 text-ink-dim border border-line"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* ── Cards grid / skeleton ── */}
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(min(520px,100%),1fr))]">
          {visible.map((e) => (
            <CotCard key={e.pair} entry={e} onOpen={(p) => router.push(`/cot/${p}`)} />
          ))}
        </div>
      )}

      {/* ── Educational panel ── */}
      <Panel className="mt-6">
        <PanelHead title="How to use COT data in SMC trading" icon="school" />
        <div className="grid gap-4 text-[12.5px] leading-relaxed grid-cols-1 md:grid-cols-3 text-ink-mid">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="size-6 rounded-full flex items-center justify-center font-bold text-[11px] bg-[rgba(8,174,170,0.1)] text-teal">1</div>
              <span className="font-semibold text-ink-strong">Identify the Bias</span>
            </div>
            Check whether Large Speculators are <strong>net long</strong> (positive net = bullish bias) or <strong>net short</strong> (negative net = bearish bias). Then check the WoW direction: are they adding or reducing? Adding to a net long position is the strongest bullish confirmation. The COT Index shows how extreme that positioning is within the past 3 years.
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="size-6 rounded-full flex items-center justify-center font-bold text-[11px] bg-[rgba(8,174,170,0.1)] text-teal">2</div>
              <span className="font-semibold text-ink-strong">Check Divergence</span>
            </div>
            The most powerful signal is when large specs and commercials are both aligned. Commercials hedge the opposite side, so when they are heavily short while large specs go long, that&apos;s institutional conviction you want to trade with.
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="size-6 rounded-full flex items-center justify-center font-bold text-[11px] bg-[rgba(8,174,170,0.1)] text-teal">3</div>
              <span className="font-semibold text-ink-strong">Confirm with Price</span>
            </div>
            COT alone does not give you an entry; it gives you a directional filter. Combine a bullish COT signal with a swept liquidity pool, a valid OB or FVG on HTF, and a killzone entry window. All three together = high-probability SMC setup.
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-[12.5px] leading-relaxed text-ink-mid">
          <div className="rounded-xl px-4 py-3 bg-[rgba(8,174,170,0.05)] border border-[rgba(8,174,170,0.15)]">
            <div className="font-semibold mb-1 text-teal">Extreme readings: reversal or continuation?</div>
            At COT Index &gt; 80, large specs are near their most bullish in a year. This can mean two things: price has already moved significantly (late to the party), OR the trend is strong and still has room (early in a cycle). Always check price structure: if price has NOT yet moved proportionally, COT is leading. If price has already run hard, the extreme may signal a top.
          </div>
          <div className="rounded-xl px-4 py-3 bg-[rgba(248,185,61,0.05)] border border-[rgba(248,185,61,0.15)]">
            <div className="font-semibold mb-1 text-gold">DXY is your master bias</div>
            When the USD Index (DXY) COT Index is low (large specs bearish on USD), that is a tailwind for EURUSD, GBPUSD, NZDUSD, AUDUSD, and XAUUSD longs simultaneously. Cross-reference DXY with your pairs: if DXY is bearish COT and EURUSD is bullish COT, that is the strongest possible EUR setup. Maximum confluence.
          </div>
        </div>

        {/* Data wiring note */}
        <div className="mt-4 rounded-xl px-4 py-3 text-[12px] leading-relaxed bg-panel-2 border border-line text-ink-dim">
          <strong className="text-ink-strong">Data source:</strong>{" "}
          {hasData
            ? `CFTC Legacy Futures-Only report (publicreporting.cftc.gov). ${totalHistory.toLocaleString()} total weeks across ${entries.length} instruments. Synced automatically after each release — CFTC publishes Tuesday's data on Fridays ~15:30 ET.`
            : "No data loaded yet — data syncs automatically after each CFTC release (Fridays ~15:30 ET)."}
        </div>
      </Panel>

    </div>
  );
}
