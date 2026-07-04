"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Icon, Ring, Sparkline, Skeleton, Panel, PanelHead } from "@/components/ui";
import type { CotSignal } from "@/app/api/cot/route";
import type { CotDetailResponse, CotDetailRow } from "@/app/api/cot/[pair]/route";
import type { CalEvent } from "@/app/api/calendar/route";
import type { PriceTick } from "@/app/api/prices/route";

// ── Pair metadata ─────────────────────────────────────────────────────────────

type Bias = "bullish" | "bearish" | "ranging";
const TFS = ["MN", "W", "D", "H4", "H1"] as const;
type TF = typeof TFS[number];

interface PairMeta {
  label:      string;
  base:       string;   // e.g. "EUR" for EURUSD
  quote:      string;   // e.g. "USD"
  currencies: string[]; // for calendar filtering
  usdBase:    boolean;
}

const PAIR_META: Record<string, PairMeta> = {
  EURUSD: { label: "Euro FX",           base: "EUR", quote: "USD", currencies: ["EUR", "USD"], usdBase: false },
  GBPUSD: { label: "British Pound",      base: "GBP", quote: "USD", currencies: ["GBP", "USD"], usdBase: false },
  AUDUSD: { label: "Australian Dollar",  base: "AUD", quote: "USD", currencies: ["AUD", "USD"], usdBase: false },
  NZDUSD: { label: "NZ Dollar",          base: "NZD", quote: "USD", currencies: ["NZD", "USD"], usdBase: false },
  USDJPY: { label: "Japanese Yen",       base: "USD", quote: "JPY", currencies: ["USD", "JPY"], usdBase: true  },
  USDCHF: { label: "Swiss Franc",        base: "USD", quote: "CHF", currencies: ["USD", "CHF"], usdBase: true  },
  USDCAD: { label: "Canadian Dollar",    base: "USD", quote: "CAD", currencies: ["USD", "CAD"], usdBase: true  },
  XAUUSD: { label: "Gold",               base: "XAU", quote: "USD", currencies: ["XAU", "USD"], usdBase: false },
  NAS100: { label: "NASDAQ E-mini",      base: "NAS", quote: "USD", currencies: ["USD"],         usdBase: false },
  DXY:    { label: "USD Index",          base: "USD", quote: "",    currencies: ["USD"],         usdBase: false },
};

// ── Signal config ─────────────────────────────────────────────────────────────

interface SigCfg { label: string; color: string; bg: string; border: string; icon: string }

const SIGNAL_CFG: Record<CotSignal, SigCfg> = {
  strong_bull: { label: "Strong Bullish Setup", color: "var(--teal-bright)",  bg: "rgba(48,232,223,0.10)",  border: "rgba(48,232,223,0.22)",  icon: "trending_up"    },
  bull:        { label: "Bullish Bias",          color: "var(--teal)",         bg: "rgba(8,174,170,0.08)",   border: "rgba(8,174,170,0.20)",   icon: "arrow_upward"   },
  neutral:     { label: "Neutral / Mixed",       color: "var(--gold)",         bg: "rgba(248,185,61,0.08)",  border: "rgba(248,185,61,0.20)",  icon: "remove"         },
  bear:        { label: "Bearish Bias",          color: "var(--coral)",        bg: "rgba(234,82,61,0.08)",   border: "rgba(234,82,61,0.20)",   icon: "arrow_downward" },
  strong_bear: { label: "Strong Bearish Setup",  color: "var(--coral-bright)", bg: "rgba(255,89,66,0.10)",   border: "rgba(255,89,66,0.22)",   icon: "trending_down"  },
};

// ── Bias verdict ──────────────────────────────────────────────────────────────

type VerdictTone = "confirmed_bull" | "lean_bull" | "mixed" | "lean_bear" | "confirmed_bear";

interface Verdict {
  tone:     VerdictTone;
  label:    string;
  desc:     string;
  color:    string;
  bg:       string;
  border:   string;
  icon:     string;
  cotScore: number;
  htfScore: number;
  dxyScore: number;
  total:    number;
}

function sigToScore(s: CotSignal | null): number {
  if (s === "strong_bull" || s === "bull") return 1;
  if (s === "strong_bear" || s === "bear") return -1;
  return 0;
}

function htfScore(tfs: Partial<Record<TF, Bias>>): number {
  const w = tfs.W;
  const d = tfs.D;
  if (w === "bullish" && d === "bullish") return 1;
  if (w === "bearish" && d === "bearish") return -1;
  return 0;
}

function computeVerdict(
  cotSignal: CotSignal | null,
  trendTFs:  Partial<Record<TF, Bias>>,
  dxySignal: CotSignal | null,
  usdBase:   boolean,
): Verdict {
  const cot = sigToScore(cotSignal);
  const htf = htfScore(trendTFs);
  const rawDxy = sigToScore(dxySignal);
  const dxy = usdBase ? rawDxy : -rawDxy;
  const total = cot + htf + dxy;

  if (total >= 2)  return { tone: "confirmed_bull", label: "Confirmed Bullish", desc: "All three factors confirm bullish institutional bias. Trade longs with full confluence.", color: "var(--teal-bright)",  bg: "rgba(48,232,223,0.07)", border: "rgba(48,232,223,0.22)", icon: "trending_up",   cotScore: cot, htfScore: htf, dxyScore: dxy, total };
  if (total === 1) return { tone: "lean_bull",       label: "Bullish Lean",      desc: "Two of three factors lean bullish. Good directional edge. Seek HTF structure confirmation.", color: "var(--teal)",         bg: "rgba(8,174,170,0.06)",  border: "rgba(8,174,170,0.18)",  icon: "arrow_upward",  cotScore: cot, htfScore: htf, dxyScore: dxy, total };
  if (total === 0) return { tone: "mixed",           label: "No Clear Bias",     desc: "Factors are divided. No statistical edge from COT or trend alignment this week. Wait for clarity.", color: "var(--gold)",         bg: "rgba(248,185,61,0.06)", border: "rgba(248,185,61,0.18)", icon: "remove",        cotScore: cot, htfScore: htf, dxyScore: dxy, total };
  if (total === -1)return { tone: "lean_bear",       label: "Bearish Lean",      desc: "Two of three factors lean bearish. Good directional edge. Wait for a structure shift on HTF.", color: "var(--coral)",        bg: "rgba(234,82,61,0.06)",  border: "rgba(234,82,61,0.18)",  icon: "arrow_downward",cotScore: cot, htfScore: htf, dxyScore: dxy, total };
  return               { tone: "confirmed_bear",  label: "Confirmed Bearish", desc: "All three factors confirm bearish institutional bias. Trade shorts with full confluence.", color: "var(--coral-bright)", bg: "rgba(255,89,66,0.07)",  border: "rgba(255,89,66,0.22)",  icon: "trending_down", cotScore: cot, htfScore: htf, dxyScore: dxy, total };
}

// ── Bias cell ─────────────────────────────────────────────────────────────────

const BIAS_CELL: Record<Bias, { icon: string; label: string; color: string; bg: string }> = {
  bullish: { icon: "trending_up",   label: "Bull",     color: "var(--teal-bright)",  bg: "rgba(48,232,223,0.10)"  },
  bearish: { icon: "trending_down", label: "Bear",     color: "var(--coral-bright)", bg: "rgba(255,89,66,0.10)"   },
  ranging: { icon: "trending_flat", label: "Ranging",  color: "var(--gold)",         bg: "rgba(248,185,61,0.10)"  },
};

function BiasCell({ tf, bias }: { tf: string; bias: Bias | undefined }) {
  const cfg = bias ? BIAS_CELL[bias] : null;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--ink-dim)" }}>{tf}</div>
      <div
        className="flex flex-col items-center justify-center rounded-xl gap-0.5"
        style={{
          width: 50, height: 38,
          background: cfg ? cfg.bg : "var(--panel-2)",
          border: `1px solid ${cfg ? cfg.color + "33" : "var(--line)"}`,
          color: cfg ? cfg.color : "var(--ink-dim)",
        }}
      >
        {cfg ? (
          <>
            <Icon name={cfg.icon} size={13} />
            <span className="text-[9px] font-bold">{cfg.label}</span>
          </>
        ) : (
          <span className="text-[12px]" style={{ color: "var(--ink-dim)" }}>—</span>
        )}
      </div>
    </div>
  );
}

// ── Score factor badge ────────────────────────────────────────────────────────

function FactorBadge({ label: factorLabel, score }: { label: string; score: number }) {
  const positive  = score > 0;
  const negative  = score < 0;
  const color     = positive ? "var(--teal)" : negative ? "var(--coral)" : "var(--ink-dim)";
  const bg        = positive ? "rgba(8,174,170,0.08)" : negative ? "rgba(234,82,61,0.08)" : "var(--panel-2)";
  const icon      = positive ? "check_circle" : negative ? "cancel" : "radio_button_unchecked";
  const valueLabel = positive ? "Bullish" : negative ? "Bearish" : "Neutral";
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-2.5"
      style={{ background: bg, border: `1px solid ${color}33` }}
    >
      <Icon name={icon} size={15} fill style={{ color, flexShrink: 0 }} />
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-dim)" }}>
          {factorLabel}
        </div>
        <div className="text-[12.5px] font-bold" style={{ color }}>{valueLabel}</div>
      </div>
    </div>
  );
}

// ── Impact dots ───────────────────────────────────────────────────────────────

const IMPACT_COLOR: Record<number, string> = { 1: "var(--ink-dim)", 2: "var(--gold)", 3: "var(--coral)" };

function ImpactDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="w-1.5 h-1.5 rounded-full"
          style={{ background: i <= level ? IMPACT_COLOR[level] : "var(--track)" }} />
      ))}
    </div>
  );
}

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtNet(n: number): string {
  const abs = Math.abs(n);
  const sign = n >= 0 ? "+" : "−";
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${sign}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${abs}`;
}

function fmtTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"} UTC`;
}

// ── Currency chip ─────────────────────────────────────────────────────────────

function CurrencyChip({ code }: { code: string }) {
  if (!code) return null;
  return (
    <span
      className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-lg tracking-wide"
      style={{ background: "var(--panel-2)", color: "var(--ink-mid)", border: "1px solid var(--line)" }}
    >
      {code}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PairOverviewPage() {
  const { pair } = useParams<{ pair: string }>();
  const router   = useRouter();
  const P        = pair.toUpperCase();
  const meta     = PAIR_META[P];

  const [cotData,     setCotData]     = useState<CotDetailResponse | null>(null);
  const [dxyData,     setDxyData]     = useState<CotDetailResponse | null>(null);
  const [calEvents,   setCalEvents]   = useState<CalEvent[]>([]);
  const [priceTick,   setPriceTick]   = useState<PriceTick | null>(null);
  const [trendMatrix, setTrendMatrix] = useState<Partial<Record<TF, Bias>>>({});
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("smile-fx-trend-matrix");
      if (raw) {
        const parsed = JSON.parse(raw);
        const mat = parsed?.matrix?.[P] as Partial<Record<TF, Bias>> | undefined;
        if (mat) setTrendMatrix(mat);
      }
    } catch { /* ignore */ }

    Promise.allSettled([
      fetch(`/api/cot/${P}`).then((r) => r.json() as Promise<CotDetailResponse>),
      fetch(`/api/cot/DXY`).then((r)  => r.json() as Promise<CotDetailResponse>),
      fetch(`/api/calendar`).then((r) => r.json() as Promise<CalEvent[]>),
      fetch(`/api/prices`).then((r)   => r.json() as Promise<PriceTick[]>),
    ]).then(([cot, dxy, cal, prices]) => {
      if (cot.status    === "fulfilled") setCotData(cot.value);
      if (dxy.status    === "fulfilled") setDxyData(dxy.value);
      if (cal.status    === "fulfilled") setCalEvents(cal.value);
      if (prices.status === "fulfilled") {
        const tick = (prices.value as PriceTick[]).find((t) => t.sym === P);
        if (tick) setPriceTick(tick);
      }
      setLoading(false);
    });
  }, [P]); // eslint-disable-line react-hooks/exhaustive-deps

  const verdict = useMemo(
    () => computeVerdict(cotData?.signal ?? null, trendMatrix, dxyData?.signal ?? null, meta?.usdBase ?? false),
    [cotData, trendMatrix, dxyData, meta]
  );

  const sparkData = useMemo(
    () => cotData ? [...cotData.rows.slice(0, 8)].reverse().map((r: CotDetailRow) => r.largeSpecNet) : [],
    [cotData]
  );

  const relevantEvents = useMemo(
    () => calEvents.filter((e) => meta?.currencies.includes(e.currency)).slice(0, 8),
    [calEvents, meta]
  );

  const tfs        = TFS.map((tf) => trendMatrix[tf]).filter(Boolean) as Bias[];
  const bullCount  = tfs.filter((b) => b === "bullish").length;
  const bearCount  = tfs.filter((b) => b === "bearish").length;
  const confBias   = bullCount > bearCount ? "bullish" : bearCount > bullCount ? "bearish" : "ranging";
  const confCount  = Math.max(bullCount, bearCount);
  const confColor  = confBias === "bullish" ? "var(--teal)" : confBias === "bearish" ? "var(--coral)" : "var(--gold)";

  const cotSig = cotData ? SIGNAL_CFG[cotData.signal] : null;

  if (!meta) {
    return (
      <div className="view">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 mb-5 text-[13px] font-semibold hover:opacity-75" style={{ color: "var(--ink-dim)" }}>
          <Icon name="arrow_back" size={16} /> Back
        </button>
        <div className="rounded-2xl px-5 py-4 text-[13px]" style={{ background: "rgba(234,82,61,0.07)", border: "1px solid rgba(234,82,61,0.2)", color: "var(--coral)" }}>
          Unknown pair: {P}
        </div>
      </div>
    );
  }

  return (
    <div className="view">

      {/* ── Back ── */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1.5 mb-5 text-[13px] font-semibold hover:opacity-75 active:scale-95 transition-all"
        style={{ color: "var(--ink-dim)" }}
      >
        <Icon name="arrow_back" size={16} />
        Back
      </button>

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <CurrencyChip code={meta.base} />
            {meta.quote && <CurrencyChip code={meta.quote} />}
            <h1
              className="font-display font-bold"
              style={{ fontSize: 28, letterSpacing: "-0.025em", color: "var(--ink-strong)" }}
            >
              {P}
            </h1>
            <span className="text-[15px]" style={{ color: "var(--ink-dim)" }}>·</span>
            <span className="text-[15px]" style={{ color: "var(--ink-mid)" }}>{meta.label}</span>
            {meta.usdBase && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-lg"
                style={{ background: "var(--panel-2)", color: "var(--ink-dim)", border: "1px solid var(--line)" }}
              >
                USD-base
              </span>
            )}
          </div>
          <p className="text-[13px]" style={{ color: "var(--ink-dim)" }}>
            Pair overview · COT bias, trend alignment, upcoming events
          </p>
        </div>

        {/* Live price */}
        {priceTick ? (
          <div className="flex flex-col items-end shrink-0">
            <span
              className="font-display font-bold tabular-nums text-[24px]"
              style={{ color: "var(--ink-strong)", letterSpacing: "-0.025em", fontFeatureSettings: '"tnum"' }}
            >
              {priceTick.price}
            </span>
            <span
              className="text-[12.5px] font-semibold tabular-nums flex items-center gap-1"
              style={{ color: priceTick.chg >= 0 ? "var(--teal-bright)" : "var(--coral-bright)" }}
            >
              <Icon name={priceTick.chg >= 0 ? "arrow_upward" : "arrow_downward"} size={12} />
              {Math.abs(priceTick.chg)}% today
            </span>
          </div>
        ) : loading ? (
          <Skeleton h={44} w={100} r={8} />
        ) : null}
      </div>

      {/* ── Weekly Bias Card ── */}
      <div
        className="rounded-2xl px-6 py-5 mb-6"
        style={{ background: verdict.bg, border: `2px solid ${verdict.border}` }}
      >
        <div className="text-[10.5px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--ink-dim)" }}>
          Weekly Bias · Three-Factor Confluence
        </div>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          {/* Verdict label */}
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className="flex items-center justify-center rounded-xl"
                style={{ width: 36, height: 36, background: verdict.border, flexShrink: 0 }}
              >
                <Icon name={verdict.icon} size={20} fill style={{ color: verdict.color }} />
              </div>
              <span
                className="font-display font-bold"
                style={{ fontSize: 22, color: verdict.color, letterSpacing: "-0.02em" }}
              >
                {verdict.label}
              </span>
            </div>
            <p className="text-[12.5px] leading-relaxed max-w-md" style={{ color: "var(--ink-mid)" }}>
              {verdict.desc}
            </p>
          </div>

          {/* Three factor badges */}
          <div className="flex items-stretch gap-2 flex-wrap">
            <FactorBadge label="COT Signal" score={verdict.cotScore} />
            <FactorBadge label="HTF Trend (W + D)" score={verdict.htfScore} />
            <FactorBadge label="DXY Confirmation" score={verdict.dxyScore} />
          </div>
        </div>
      </div>

      {/* ── 2-column content ── */}
      <div className="grid gap-5" style={{ gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)" }}>

        {/* ═══ LEFT ═══ */}
        <div className="flex flex-col gap-5">

          {/* Trend Matrix */}
          <Panel>
            <PanelHead
              title="Trend Matrix"
              icon="grid_on"
              sub={`${P} · ${tfs.length > 0 ? `${tfs.length}/5 timeframes set` : "No data yet"}`}
              action={
                <Link
                  href="/trend"
                  className="flex items-center gap-1 text-[12px] font-semibold hover:opacity-75 transition-opacity"
                  style={{ color: "var(--teal)" }}
                >
                  Edit <Icon name="open_in_new" size={12} />
                </Link>
              }
            />

            {tfs.length === 0 ? (
              <div
                className="flex items-start gap-3 rounded-xl px-4 py-3.5 text-[12.5px] leading-relaxed"
                style={{ background: "rgba(248,185,61,0.05)", border: "1px solid rgba(248,185,61,0.18)", color: "var(--ink-mid)" }}
              >
                <Icon name="info" size={15} fill style={{ color: "var(--gold)", flexShrink: 0, marginTop: 1 }} />
                <span>
                  No trend data for {P}.{" "}
                  <Link href="/trend" style={{ color: "var(--teal)" }} className="underline underline-offset-2">
                    Open the Trend Matrix
                  </Link>{" "}
                  to set timeframe biases for this pair.
                </span>
              </div>
            ) : (
              <div>
                <div className="flex items-end gap-3 mb-4">
                  {TFS.map((tf) => (
                    <BiasCell key={tf} tf={tf} bias={trendMatrix[tf]} />
                  ))}
                  {/* Confluence score */}
                  <div className="ml-auto flex flex-col items-end gap-1">
                    <div className="text-[10.5px]" style={{ color: "var(--ink-dim)" }}>Confluence</div>
                    <div
                      className="font-display font-bold tabular-nums"
                      style={{ fontSize: 22, color: confColor, letterSpacing: "-0.02em" }}
                    >
                      {confCount}<span className="text-[13px]" style={{ color: "var(--ink-dim)" }}>/5</span>
                    </div>
                    <div className="text-[11px] font-semibold capitalize" style={{ color: confColor }}>
                      {confBias}
                    </div>
                  </div>
                </div>
                {/* Confluence bar */}
                <div style={{ height: 5, borderRadius: 3, background: "var(--track)", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${(confCount / 5) * 100}%`,
                      borderRadius: 3,
                      background: confColor,
                      transition: "width 700ms var(--ease-app)",
                    }}
                  />
                </div>
              </div>
            )}
          </Panel>

          {/* Economic Calendar */}
          <Panel pad={0}>
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--line)" }}
            >
              <div>
                <div className="text-[15px] font-semibold" style={{ color: "var(--ink-strong)" }}>
                  Economic Calendar
                </div>
                <div className="text-[12px] mt-0.5" style={{ color: "var(--ink-dim)" }}>
                  {meta.currencies.join(" + ")} events this week
                </div>
              </div>
              <Link
                href="/calendar"
                className="flex items-center gap-1 text-[12px] font-semibold hover:opacity-75"
                style={{ color: "var(--teal)" }}
              >
                Full calendar <Icon name="open_in_new" size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="flex flex-col gap-2 p-5">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={42} r={6} />)}
              </div>
            ) : relevantEvents.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Icon name="event_busy" size={28} style={{ color: "var(--ink-dim)", margin: "0 auto 8px" }} />
                <div className="text-[13px]" style={{ color: "var(--ink-dim)" }}>
                  No {meta.currencies.join("/")} events this week
                </div>
              </div>
            ) : (
              <>
                {relevantEvents.map((ev, i) => (
                  <div
                    key={ev.id}
                    className="flex items-center gap-3 px-5 py-3"
                    style={{
                      borderBottom: i < relevantEvents.length - 1 ? "1px solid var(--line)" : "none",
                      background: ev.impact === 3 ? "rgba(234,82,61,0.025)" : "transparent",
                    }}
                  >
                    <ImpactDots level={ev.impact} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-medium truncate" style={{ color: "var(--ink-strong)" }}>
                        {ev.event}
                      </div>
                      <div className="text-[11px]" style={{ color: "var(--ink-dim)" }}>
                        {ev.date} · {fmtTime(ev.time)}
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-3 shrink-0 text-[11.5px]"
                      style={{ fontFamily: "var(--mono)", fontFeatureSettings: '"tnum"' }}
                    >
                      {ev.forecast && (
                        <span style={{ color: "var(--ink-dim)" }}>F: {ev.forecast}{ev.unit}</span>
                      )}
                      {ev.previous && (
                        <span style={{ color: "var(--ink-dim)" }}>P: {ev.previous}{ev.unit}</span>
                      )}
                      {ev.actual && (
                        <span style={{ color: "var(--teal-bright)", fontWeight: 600 }}>
                          {ev.actual}{ev.unit}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </Panel>
        </div>

        {/* ═══ RIGHT ═══ */}
        <div className="flex flex-col gap-5">

          {/* COT Snapshot */}
          <Panel>
            <PanelHead
              title="COT Snapshot"
              icon="bar_chart"
              sub={cotData ? `CFTC week ending ${cotData.reportDate}` : loading ? "Loading…" : "No data"}
              action={
                <Link
                  href={`/cot/${P}`}
                  className="flex items-center gap-1 text-[12px] font-semibold hover:opacity-75"
                  style={{ color: "var(--teal)" }}
                >
                  Full history <Icon name="open_in_new" size={12} />
                </Link>
              }
            />

            {loading ? (
              <div className="flex flex-col gap-3">
                <Skeleton h={38} r={12} />
                <div className="flex gap-3">
                  <Skeleton h={64} w={64} r={999} style={{ flexShrink: 0 }} />
                  <div className="flex-1 flex flex-col gap-2">
                    <Skeleton h={22} r={6} />
                    <Skeleton h={18} r={6} />
                    <Skeleton h={14} r={6} />
                  </div>
                </div>
                <Skeleton h={48} r={6} />
              </div>
            ) : cotData && cotSig ? (
              <>
                {/* Signal */}
                <div
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 mb-4"
                  style={{ background: cotSig.bg, border: `1px solid ${cotSig.border}` }}
                >
                  <Icon name={cotSig.icon} size={16} fill style={{ color: cotSig.color }} />
                  <span className="font-semibold text-[13px]" style={{ color: cotSig.color }}>
                    {cotSig.label}
                  </span>
                  {meta.usdBase && (
                    <span
                      className="ml-auto text-[10px] px-1.5 py-0.5 rounded-lg"
                      style={{ background: "var(--panel-2)", color: "var(--ink-dim)", border: "1px solid var(--line)" }}
                    >
                      inverted
                    </span>
                  )}
                </div>

                {/* Ring + stats */}
                <div className="flex items-start gap-4 mb-4">
                  <Ring value={cotData.cotIndex} size={60} stroke={6} color={cotSig.color}>
                    <div className="text-center">
                      <div
                        className="font-display font-bold tabular-nums leading-none"
                        style={{ fontSize: 16, color: cotSig.color }}
                      >
                        {cotData.cotIndex}
                      </div>
                      <div className="text-[9px] leading-none mt-0.5" style={{ color: "var(--ink-dim)" }}>/100</div>
                    </div>
                  </Ring>
                  <div className="flex-1">
                    <div className="text-[10.5px] mb-1.5" style={{ color: "var(--ink-dim)" }}>COT Index · 52-week range</div>
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span
                        className="font-display font-bold tabular-nums"
                        style={{ fontSize: 20, color: cotData.wowChange >= 0 ? "var(--teal-bright)" : "var(--coral-bright)", letterSpacing: "-0.02em" }}
                      >
                        {fmtNet(cotData.wowChange)}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--ink-dim)" }}>WoW</span>
                    </div>
                    {cotData.rows[0] && (
                      <div
                        className="text-[12.5px] font-semibold tabular-nums"
                        style={{ fontFamily: "var(--mono)", color: cotData.rows[0].largeSpecNet >= 0 ? "var(--teal)" : "var(--coral)" }}
                      >
                        {fmtNet(cotData.rows[0].largeSpecNet)} net
                      </div>
                    )}
                  </div>
                </div>

                {/* 8-week sparkline */}
                {sparkData.length > 1 && (
                  <div>
                    <div className="text-[10.5px] mb-1.5" style={{ color: "var(--ink-dim)" }}>Large Spec Net · 8 weeks</div>
                    <Sparkline
                      data={sparkData}
                      width={260}
                      height={48}
                      color={(cotData.rows[0]?.largeSpecNet ?? 0) >= 0 ? "var(--teal-bright)" : "var(--coral-bright)"}
                      strokeW={1.5}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-[13px] text-center py-4" style={{ color: "var(--ink-dim)" }}>
                No COT data available for {P}
              </div>
            )}
          </Panel>

          {/* DXY Confirmation */}
          {(dxyData || loading) && (
            <Panel>
              <PanelHead title="DXY Confirmation" icon="currency_exchange" />
              {loading ? (
                <div className="flex gap-2">
                  <Skeleton h={52} r={10} />
                  <Skeleton h={52} r={10} />
                </div>
              ) : dxyData ? (() => {
                const dxySig = SIGNAL_CFG[dxyData.signal];
                const confirms = meta.usdBase
                  ? (dxyData.signal === "bull" || dxyData.signal === "strong_bull")
                  : (dxyData.signal === "bear" || dxyData.signal === "strong_bear");
                return (
                  <>
                    <div className="flex items-stretch gap-2 mb-3">
                      <div
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 flex-1"
                        style={{ background: dxySig.bg, border: `1px solid ${dxySig.border}` }}
                      >
                        <Icon name={dxySig.icon} size={14} fill style={{ color: dxySig.color }} />
                        <div>
                          <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "var(--ink-dim)" }}>DXY COT</div>
                          <div className="text-[12.5px] font-semibold" style={{ color: dxySig.color }}>{dxySig.label}</div>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                        style={{
                          background: confirms ? "rgba(8,174,170,0.07)" : "rgba(234,82,61,0.07)",
                          border: `1px solid ${confirms ? "rgba(8,174,170,0.2)" : "rgba(234,82,61,0.2)"}`,
                        }}
                      >
                        <Icon
                          name={confirms ? "check_circle" : "cancel"}
                          size={16} fill
                          style={{ color: confirms ? "var(--teal)" : "var(--coral)" }}
                        />
                        <span className="text-[12.5px] font-semibold" style={{ color: confirms ? "var(--teal)" : "var(--coral)" }}>
                          {confirms ? "Confirms" : "Diverges"}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11.5px] leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                      {meta.usdBase
                        ? "DXY bullish = strong USD = bullish for this pair. DXY bearish = USD weakness = bearish pressure."
                        : "DXY bearish = weak USD = bullish for this pair. DXY bullish = USD strength = bearish pressure."}
                    </p>
                  </>
                );
              })() : null}
            </Panel>
          )}

          {/* Key Levels */}
          <Panel>
            <PanelHead title="Key Levels" icon="straighten" />
            <div className="flex flex-col" style={{ color: "var(--ink-dim)" }}>
              {[
                "Previous Week High",
                "Previous Week Low",
                "Previous Day High",
                "Previous Day Low",
                "Nearest Order Block",
              ].map((label, i, arr) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-2.5 text-[12.5px]"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none" }}
                >
                  <span>{label}</span>
                  <span className="tabular-nums" style={{ fontFamily: "var(--mono)", color: "var(--ink-dim)" }}>—</span>
                </div>
              ))}
            </div>
            <div
              className="mt-3 rounded-xl px-3 py-2.5 flex items-center gap-2 text-[11.5px]"
              style={{ background: "rgba(248,185,61,0.05)", border: "1px solid rgba(248,185,61,0.15)", color: "var(--gold)" }}
            >
              <Icon name="construction" size={13} />
              Manual entry or journal integration coming soon
            </div>
          </Panel>

          {/* News */}
          <Panel>
            <PanelHead title="Recent News" icon="newspaper" />
            <div
              className="rounded-xl px-4 py-4 flex items-start gap-3 text-[12.5px]"
              style={{ background: "var(--panel-2)", border: "1px solid var(--line)", color: "var(--ink-dim)" }}
            >
              <Icon name="rss_feed" size={16} style={{ color: "var(--ink-dim)", flexShrink: 0, marginTop: 1 }} />
              <span>
                News feed requires a news API key (e.g. Finnhub, NewsAPI).{" "}
                <span style={{ color: "var(--gold)" }}>Coming soon.</span>
              </span>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
