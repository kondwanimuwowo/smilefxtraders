"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Panel, PanelHead, Sparkline, Skeleton, Icon } from "@/components/ui";
import { CotIndexDisplay } from "@/components/cot/CotIndexDisplay";
import type { CotEntry, CotSignal } from "@/app/api/cot/route";

// ── Signal config ─────────────────────────────────────────────────────────────

interface SignalCfg {
  label:     string;
  shortLabel: string;
  color:     string;
  bg:        string;
  icon:      string;
}

const SIGNAL_CFG: Record<CotSignal, SignalCfg> = {
  strong_bull: { label: "Strong Bullish Setup",  shortLabel: "S.Bull",  color: "var(--teal-bright)",  bg: "rgba(48,232,223,0.12)",  icon: "trending_up"   },
  bull:        { label: "Bullish Bias",           shortLabel: "Bull",    color: "var(--teal)",         bg: "rgba(8,174,170,0.10)",   icon: "arrow_upward"  },
  neutral:     { label: "Neutral / Mixed",        shortLabel: "Neutral", color: "var(--ink-dim)",      bg: "var(--panel-2)",         icon: "remove"        },
  bear:        { label: "Bearish Bias",           shortLabel: "Bear",    color: "var(--coral)",        bg: "rgba(234,82,61,0.10)",   icon: "arrow_downward"},
  strong_bear: { label: "Strong Bearish Setup",   shortLabel: "S.Bear",  color: "var(--coral-bright)", bg: "rgba(255,89,66,0.12)",   icon: "trending_down" },
};

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

function PositionBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct     = Math.min(Math.abs(value) / (max || 1) * 100, 100);
  const negative = value < 0;
  return (
    <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: "var(--track)" }}>
      <div
        className="absolute top-0 h-full rounded-full"
        style={{
          width: `${pct / 2}%`,
          background: color,
          left:  negative ? undefined : "50%",
          right: negative ? "50%" : undefined,
          transition: "width 700ms var(--ease-app)",
        }}
      />
      <div className="absolute inset-y-0 w-px" style={{ left: "50%", background: "var(--line)" }} />
    </div>
  );
}

// ── Divergence panel ──────────────────────────────────────────────────────────

function DivergencePanel({ entry }: { entry: CotEntry }) {
  const { divergenceType, wowChange, history, cotIndex } = entry;

  const lsChange = history[0].largeSpecNet  - (history[1]?.largeSpecNet  ?? history[0].largeSpecNet);
  const cChange  = history[0].commercialNet - (history[1]?.commercialNet ?? history[0].commercialNet);

  const lsBull = lsChange > 0;

  // Whether the weekly flow aligns with the structural COT Index level
  const structurallyBull = cotIndex >= 50;
  const flowMatchesStructure = lsBull === structurallyBull;

  // Nuanced body for "aligned" when weekly flow contradicts the structural level
  function alignedBody(): string {
    if (lsBull) {
      if (structurallyBull) {
        return `Large specs added ${fmt(Math.abs(lsChange))} longs while commercials increased hedging, with both groups confirming ${entry.pair} upside. COT Index at ${cotIndex} confirms structural bullish bias.`;
      }
      // Adding longs but still historically underweight
      return `Large specs added ${fmt(Math.abs(lsChange))} longs this week (COT Index ${cotIndex}, still historically underweight). This may signal early accumulation, but wait for the COT Index to break above 50 before calling a sustained bullish shift.`;
    } else {
      if (!structurallyBull) {
        return `Large specs added ${fmt(Math.abs(lsChange))} shorts while commercials reduced hedges, with both confirming ${entry.pair} downside. COT Index at ${cotIndex} confirms structural bearish bias.`;
      }
      // Reducing longs but still historically overweight
      return `Large specs trimmed ${fmt(Math.abs(lsChange))} longs this week (COT Index ${cotIndex}, still historically elevated). Early signs of distribution. Monitor for sustained liquidation before shifting bias bearish.`;
    }
  }

  const configs = {
    aligned: {
      color:  lsBull ? (flowMatchesStructure ? "var(--teal)" : "var(--gold)") : (flowMatchesStructure ? "var(--coral)" : "var(--gold)"),
      bg:     lsBull ? (flowMatchesStructure ? "rgba(8,174,170,0.06)" : "rgba(248,185,61,0.06)") : (flowMatchesStructure ? "rgba(234,82,61,0.06)" : "rgba(248,185,61,0.06)"),
      border: lsBull ? (flowMatchesStructure ? "rgba(8,174,170,0.2)" : "rgba(248,185,61,0.2)") : (flowMatchesStructure ? "rgba(234,82,61,0.2)" : "rgba(248,185,61,0.2)"),
      icon:   flowMatchesStructure ? "bolt" : "trending_flat",
      title:  flowMatchesStructure ? "Groups Aligned: High Conviction" : "Weekly Flow vs Structure: Watch Carefully",
      body:   alignedBody(),
    },
    mixed: {
      color:  "var(--gold)",
      bg:     "rgba(248,185,61,0.06)",
      border: "rgba(248,185,61,0.2)",
      icon:   "warning_amber",
      title:  "Mixed: Consolidation or Transition",
      body:   `Position change this week (${fmt(wowChange)}) is small, so the market may be consolidating. COT Index at ${cotIndex}. Wait for clearer directional conviction before placing higher-timeframe bias.`,
    },
    counter: {
      color:  "var(--gold)",
      bg:     "rgba(248,185,61,0.06)",
      border: "rgba(248,185,61,0.2)",
      icon:   "sync_alt",
      title:  "Counter-Movement: Watch for Reversal",
      body:   `Large specs and commercials moving in opposite directions (LS: ${fmt(lsChange)}, C: ${fmt(cChange)}). COT Index at ${cotIndex}. Counter-divergence often precedes a structure shift — stay patient, wait for CHoCH confirmation.`,
    },
  };

  const cfg = configs[divergenceType];

  return (
    <div
      className="mx-5 mb-4 rounded-xl px-4 py-3 flex items-start gap-2.5"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <Icon name={cfg.icon} size={15} fill style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }} />
      <div>
        <div className="text-[12px] font-semibold mb-0.5" style={{ color: cfg.color }}>{cfg.title}</div>
        <p className="text-[12px] leading-relaxed" style={{ color: "var(--ink-dim)" }}>{cfg.body}</p>
      </div>
    </div>
  );
}

// ── History table ─────────────────────────────────────────────────────────────

function HistoryTable({ history }: { history: CotEntry["history"] }) {
  const rows = history.slice(0, 4);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11.5px]" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--line)" }}>
            {["Date", "Large Spec", "Commercials", "Small Spec", "WoW Chg"].map((h) => (
              <th key={h} className="text-left py-2 px-3 font-semibold tabular-nums"
                style={{ color: "var(--ink-dim)", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((w, i) => {
            const prev = rows[i + 1];
            const chg  = prev ? w.largeSpecNet - prev.largeSpecNet : null;
            return (
              <tr key={w.date} style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none" }}>
                <td className="py-2 px-3 tabular-nums" style={{ color: "var(--ink-mid)", whiteSpace: "nowrap" }}>
                  {fmtDate(w.date)}
                </td>
                <td className="py-2 px-3 tabular-nums font-medium" style={{ color: w.largeSpecNet >= 0 ? "var(--teal-bright)" : "var(--coral-bright)" }}>
                  {fmt(w.largeSpecNet)}
                  {prev && (
                    <Icon name={w.largeSpecNet > prev.largeSpecNet ? "arrow_upward" : "arrow_downward"}
                      size={11} style={{ color: "inherit", marginLeft: 2, opacity: 0.7 }} />
                  )}
                </td>
                <td className="py-2 px-3 tabular-nums font-medium" style={{ color: w.commercialNet >= 0 ? "var(--teal)" : "var(--coral)" }}>
                  {fmt(w.commercialNet)}
                </td>
                <td className="py-2 px-3 tabular-nums" style={{ color: "var(--ink-dim)" }}>
                  {fmt(w.smallSpecNet)}
                </td>
                <td className="py-2 px-3 tabular-nums font-semibold" style={{ color: chg === null ? "var(--ink-dim)" : chg >= 0 ? "var(--teal-bright)" : "var(--coral-bright)" }}>
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
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded"
      style={{ background: "rgba(8,174,170,0.08)", color: "var(--teal)", border: "1px solid rgba(8,174,170,0.18)" }}
    >
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
      <div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
      >
        <div className="size-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--panel-2)" }}>
          <Icon name="hourglass_empty" size={18} style={{ color: "var(--ink-dim)" }} />
        </div>
        <div>
          <div className="font-display font-bold text-[15px]" style={{ color: "var(--ink-strong)" }}>{entry.label}</div>
          <div className="text-[12px] mt-0.5" style={{ color: "var(--ink-dim)" }}>
            COT data not yet available. Check back after the next Tuesday sync.
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
      className="rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-150 h-full"
      style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
      onClick={() => onOpen(entry.pair)}
      role="button"
      aria-label={`Open ${entry.pair} COT detail`}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--teal)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--line)"; }}
    >
      {/* ── Card header ── */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-display font-bold text-[20px]" style={{ color: "var(--ink-strong)", letterSpacing: "-0.02em" }}>
              {entry.pair}
            </span>
            <span className="text-[11px]" style={{ color: "var(--ink-dim)" }}>·</span>
            <span className="text-[13px]" style={{ color: "var(--ink-mid)" }}>{entry.label}</span>
            {/* Signal badge */}
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
              style={{ background: sig.bg, color: sig.color }}
            >
              <Icon name={sig.icon} size={12} />
              {sig.label}
            </span>
            {entry.totalWeeks > 0 && <HistoryBadge weeks={entry.totalWeeks} />}
            {entry.usdBase && (
              <span
                title="Positions shown for the foreign currency futures (JPY/CHF/CAD). Net positive = bullish on the USD pair."
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded cursor-help"
                style={{ background: "var(--panel-2)", color: "var(--ink-dim)", border: "1px solid var(--line)" }}
              >
                USD-base · inverted
              </span>
            )}
          </div>
          <div className="text-[12px]" style={{ color: "var(--ink-dim)" }}>
            CFTC report week ending {entry.reportDate}
          </div>
        </div>

        {/* WoW change + overview link */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="text-right">
            <div
              className="font-display font-bold tabular-nums text-[18px]"
              style={{ color: entry.wowChange >= 0 ? "var(--teal-bright)" : "var(--coral-bright)", letterSpacing: "-0.01em" }}
            >
              {fmt(entry.wowChange)}
            </div>
            <div className="text-[11px]" style={{ color: "var(--ink-dim)" }}>WoW change</div>
          </div>
          <Link
            href={`/pair/${entry.pair}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[11px] font-semibold transition-colors hover:opacity-80"
            style={{ color: "var(--teal)" }}
          >
            Overview <Icon name="open_in_new" size={11} />
          </Link>
        </div>
      </div>

      {/* ── COT Index + Position bars + Sparkline ── */}
      <div className="px-5 pb-4 grid gap-5" style={{ gridTemplateColumns: "auto 1fr auto" }}>

        {/* COT Index — compact display with zone label + lookback */}
        <CotIndexDisplay
          rows={entry.history}
          cotIndex={entry.cotIndex}
          signal={entry.signal}
          pair={entry.pair}
          totalWeeks={entry.totalWeeks}
          compact
        />

        {/* Position breakdown */}
        <div className="flex flex-col justify-center gap-3.5">
          {[
            { label: "Large Speculators", sub: "Smart Money: institutions", value: cur.largeSpecNet,  prev: prev.largeSpecNet,  color: cur.largeSpecNet  >= 0 ? "var(--teal)" : "var(--coral)" },
            { label: "Commercials",       sub: "Hedgers: contrarian signal", value: cur.commercialNet, prev: prev.commercialNet, color: cur.commercialNet >= 0 ? "var(--teal)" : "var(--coral)" },
            { label: "Small Speculators", sub: "Retail: fade at extremes",   value: cur.smallSpecNet,  prev: prev.smallSpecNet,  color: "var(--ink-dim)" },
          ].map(({ label, sub, value, prev: p, color }) => {
            const chg = value - p;
            return (
              <div key={label}>
                <div className="flex items-start justify-between mb-1.5 gap-2">
                  <div>
                    <div className="text-[11.5px] font-semibold leading-tight" style={{ color: "var(--ink-mid)" }}>{label}</div>
                    <div className="text-[10.5px] leading-tight" style={{ color: "var(--ink-dim)" }}>{sub}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold tabular-nums text-[13px]" style={{ color }}>
                      {fmt(value)}
                    </div>
                    <div className="text-[10px] tabular-nums" style={{ color: chg >= 0 ? "var(--teal-bright)" : "var(--coral-bright)" }}>
                      {fmt(chg)} WoW
                    </div>
                  </div>
                </div>
                <PositionBar value={value} max={maxPos} color={color} />
              </div>
            );
          })}
        </div>

        {/* 8-week sparkline */}
        <div className="flex flex-col items-center justify-center gap-1.5" style={{ minWidth: 100 }}>
          <div className="text-[10px] font-semibold text-center mb-0.5" style={{ color: "var(--ink-dim)" }}>
            Large Spec · 8W
          </div>
          <Sparkline data={sparkData} width={100} height={48} color={sparkColor} strokeW={1.5} />
          <div className="w-full flex justify-between text-[10px] tabular-nums" style={{ color: "var(--ink-dim)" }}>
            <span>{fmtAbs(Math.min(...sparkData))}</span>
            <span>{fmtAbs(Math.max(...sparkData))}</span>
          </div>
          <div className="text-[10px] text-center" style={{ color: "var(--ink-dim)" }}>
            {entry.history.length >= 8 ? "8 weeks" : `${entry.history.length} weeks`}
          </div>
        </div>
      </div>

      {/* ── Divergence analysis ── */}
      <DivergencePanel entry={entry} />

      {/* ── History table toggle (button only — inside card so it clips correctly) ── */}
      <div className="mt-auto" style={{ borderTop: "1px solid var(--line)" }} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setHistOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-2.5 text-[12px] font-semibold transition-colors hover:bg-[var(--hover)]"
          style={{ color: "var(--ink-mid)" }}
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
        className="absolute left-0 right-0 z-20 px-2 pb-3"
        style={{
          top: "100%",
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderTop: "none",
          borderRadius: "0 0 16px 16px",
          boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
        }}
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
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold"
            style={{ background: sig.bg, color: sig.color, border: `1px solid ${sig.bg}` }}
          >
            <Icon name={sig.icon} size={13} />
            <span style={{ color: "var(--ink-strong)" }}>{e.pair}</span>
            <span>{sig.shortLabel}</span>
            <span className="tabular-nums text-[11px]" style={{ opacity: 0.75 }}>{e.cotIndex}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(520px, 100%), 1fr))" }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: "var(--panel)", border: "1px solid var(--line)" }}>
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

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (locked) {
    return (
      <div className="view flex flex-col items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="rounded-3xl px-10 py-12 text-center max-w-md" style={{ background: "var(--panel)", border: "1px solid var(--line)" }}>
          <Icon name="lock" size={36} fill style={{ color: "var(--gold)", marginBottom: 16 }} />
          <h2 className="font-display font-bold text-[22px] mb-2" style={{ color: "var(--ink-strong)", letterSpacing: "-0.02em" }}>COT Reports</h2>
          <p className="text-[13.5px] leading-relaxed mb-6" style={{ color: "var(--ink-dim)" }}>
            CFTC Commitments of Traders data is available on the <strong style={{ color: "var(--ink-strong)" }}>Pro Trader</strong> and <strong style={{ color: "var(--ink-strong)" }}>Funded Track</strong> plans. Understand institutional positioning to align your bias with smart money.
          </p>
          <a
            href="/membership"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-[13.5px]"
            style={{ background: "var(--gold)", color: "var(--navy-deep)" }}
          >
            <Icon name="workspace_premium" size={16} fill />
            Upgrade to Pro
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="view">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-2 gap-4">
        <div>
          <h1 className="font-display font-bold" style={{ fontSize: 24, letterSpacing: "-0.02em", color: "var(--ink-strong)" }}>
            COT Reports
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--ink-dim)" }}>
            CFTC Commitments of Traders · Legacy Futures-Only · Updated weekly (Tuesdays ~15:30 EST)
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Status badge */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px]"
            style={{
              background: allLoaded ? "rgba(8,174,170,0.08)" : hasData ? "rgba(248,185,61,0.08)" : "var(--panel-2)",
              border: `1px solid ${allLoaded ? "rgba(8,174,170,0.2)" : hasData ? "rgba(248,185,61,0.2)" : "var(--line)"}`,
              color: allLoaded ? "var(--teal)" : hasData ? "var(--gold)" : "var(--ink-dim)",
            }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{
                background: allLoaded ? "var(--teal)" : hasData ? "var(--gold)" : "var(--ink-dim)",
                animation: hasData ? "var(--animate-live)" : "none",
              }}
            />
            {allLoaded
              ? `${lastDate} · ${(totalHistory / 52).toFixed(0)}yr avg history`
              : hasData
              ? `${loaded}/${entries.length} loaded · ${lastDate}`
              : "Run seed-cot to load data"}
          </div>

          {/* Refresh button */}
          {!loading && (
            <button
              type="button"
              onClick={retry}
              disabled={retrying}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all active:scale-95 disabled:opacity-60"
              style={{ background: "var(--panel-2)", border: "1px solid var(--line)", color: "var(--ink-mid)" }}
            >
              <Icon name="refresh" size={14} style={{ animation: retrying ? "spin 0.7s linear infinite" : "none" }} />
              {retrying ? "Refreshing…" : "Refresh"}
            </button>
          )}
        </div>
      </div>

      {/* ── How to read COT (compact) ── */}
      <div
        className="mb-5 rounded-xl px-4 py-3 flex items-start gap-3 text-[12px] leading-relaxed"
        style={{ background: "rgba(248,185,61,0.05)", border: "1px solid rgba(248,185,61,0.15)", color: "var(--ink-mid)" }}
      >
        <Icon name="school" size={15} fill style={{ color: "var(--gold)", flexShrink: 0, marginTop: 1 }} />
        <span>
          <strong style={{ color: "var(--ink-strong)" }}>Signal</strong> is driven by the Large Spec net position: net long = bullish bias, net short = bearish bias, confirmed by weekly momentum direction.{" "}
          <strong style={{ color: "var(--ink-strong)" }}>COT Index (0–100)</strong> shows where that positioning sits within its own 52-week range. Think of it as a cycle gauge, not the direction itself. Near 100 = historically max long (watch for exhaustion). Near 0 = historically max short (watch for reversal).{" "}
          <strong style={{ color: "var(--ink-strong)" }}>Divergence</strong> between large specs and commercials adds conviction: when both groups confirm the same direction, that&apos;s your SMC HTF bias.
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
              className="px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all active:scale-95"
              style={
                selected === p
                  ? { background: "var(--teal)", color: "#fff" }
                  : { background: "var(--panel-2)", color: "var(--ink-dim)", border: "1px solid var(--line)" }
              }
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
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(520px, 100%), 1fr))" }}>
          {visible.map((e) => (
            <CotCard key={e.pair} entry={e} onOpen={(p) => router.push(`/cot/${p}`)} />
          ))}
        </div>
      )}

      {/* ── Educational panel ── */}
      <Panel style={{ marginTop: 24 }}>
        <PanelHead title="How to use COT data in SMC trading" icon="school" />
        <div className="grid gap-4 text-[12.5px] leading-relaxed" style={{ gridTemplateColumns: "repeat(3, 1fr)", color: "var(--ink-mid)" }}>
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="size-6 rounded-full flex items-center justify-center font-bold text-[11px]"
                style={{ background: "rgba(8,174,170,0.1)", color: "var(--teal)" }}>1</div>
              <span className="font-semibold" style={{ color: "var(--ink-strong)" }}>Identify the Bias</span>
            </div>
            Check whether Large Speculators are <strong>net long</strong> (positive net = bullish bias) or <strong>net short</strong> (negative net = bearish bias). Then check the WoW direction: are they adding or reducing? Adding to a net long position is the strongest bullish confirmation. The COT Index shows how extreme that positioning is within the past 52 weeks.
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="size-6 rounded-full flex items-center justify-center font-bold text-[11px]"
                style={{ background: "rgba(8,174,170,0.1)", color: "var(--teal)" }}>2</div>
              <span className="font-semibold" style={{ color: "var(--ink-strong)" }}>Check Divergence</span>
            </div>
            The most powerful signal is when large specs and commercials are both aligned. Commercials hedge the opposite side, so when they are heavily short while large specs go long, that&apos;s institutional conviction you want to trade with.
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="size-6 rounded-full flex items-center justify-center font-bold text-[11px]"
                style={{ background: "rgba(8,174,170,0.1)", color: "var(--teal)" }}>3</div>
              <span className="font-semibold" style={{ color: "var(--ink-strong)" }}>Confirm with Price</span>
            </div>
            COT alone does not give you an entry; it gives you a directional filter. Combine a bullish COT signal with a swept liquidity pool, a valid OB or FVG on HTF, and a killzone entry window. All three together = high-probability SMC setup.
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-[12.5px] leading-relaxed" style={{ color: "var(--ink-mid)" }}>
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: "rgba(8,174,170,0.05)", border: "1px solid rgba(8,174,170,0.15)" }}
          >
            <div className="font-semibold mb-1" style={{ color: "var(--teal)" }}>Extreme readings: reversal or continuation?</div>
            At COT Index &gt; 80, large specs are near their most bullish in a year. This can mean two things: price has already moved significantly (late to the party), OR the trend is strong and still has room (early in a cycle). Always check price structure: if price has NOT yet moved proportionally, COT is leading. If price has already run hard, the extreme may signal a top.
          </div>
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: "rgba(248,185,61,0.05)", border: "1px solid rgba(248,185,61,0.15)" }}
          >
            <div className="font-semibold mb-1" style={{ color: "var(--gold)" }}>DXY is your master bias</div>
            When the USD Index (DXY) COT Index is low (large specs bearish on USD), that is a tailwind for EURUSD, GBPUSD, NZDUSD, AUDUSD, and XAUUSD longs simultaneously. Cross-reference DXY with your pairs: if DXY is bearish COT and EURUSD is bullish COT, that is the strongest possible EUR setup. Maximum confluence.
          </div>
        </div>

        {/* Data wiring note */}
        <div
          className="mt-4 rounded-xl px-4 py-3 text-[12px] leading-relaxed"
          style={{ background: "var(--panel-2)", border: "1px solid var(--line)", color: "var(--ink-dim)" }}
        >
          <strong style={{ color: "var(--ink-strong)" }}>Data source:</strong>{" "}
          {hasData
            ? `Supabase DB, seeded from CFTC Legacy Futures-Only report (publicreporting.cftc.gov/resource/6dca-aqww.json). ${totalHistory.toLocaleString()} total weeks across ${entries.length} instruments. Synced weekly via /api/cot/sync after CFTC publishes Tuesdays ~15:30 EST. No API key required.`
            : "No data in DB yet. Run: npx tsx prisma/seed-cot.ts"}
        </div>
      </Panel>

    </div>
  );
}
