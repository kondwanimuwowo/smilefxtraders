"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Icon, Ring, Sparkline, Skeleton, Panel, PanelHead } from "@/components/ui";
import { FundamentalsPanel } from "@/components/macro/FundamentalsPanel";
import { NewsFeed } from "@/components/macro/NewsFeed";
import { TRACKED_CURRENCIES } from "@/lib/macro/indicatorMap";
import { cn } from "@/lib/cn";
import type { CotSignal, CotDetailResponse, CotDetailRow } from "@/lib/cot/types";
import { SIGNAL_CFG } from "@/components/cot/signalCfg";
import type { CalEvent } from "@/app/api/calendar/route";
import type { PriceTick } from "@/app/api/prices/route";
import { deriveMetaMap } from "@/lib/pairs";
import { useInstruments } from "@/lib/hooks/useInstruments";

// ── Pair metadata ─────────────────────────────────────────────────────────────

type Bias = "bullish" | "bearish" | "ranging";
const TFS = ["MN", "W", "D", "H4", "H1"] as const;
type TF = typeof TFS[number];

// Fallback for any pair missing from the persisted trend matrix — mirrors
// TrendMatrix.tsx's own DEFAULT_ROW exactly, so a pair absent from the last
// publish renders identically on both pages instead of silently disagreeing.
const DEFAULT_ROW: Record<TF, Bias> = { MN: "ranging", W: "ranging", D: "ranging", H4: "ranging", H1: "ranging" };

// ── Bias verdict ──────────────────────────────────────────────────────────────

type VerdictTone = "confirmed_bull" | "lean_bull" | "mixed" | "lean_bear" | "confirmed_bear";

interface Verdict {
  tone:       VerdictTone;
  label:      string;
  desc:       string;
  textCls:    string;
  bgCls:      string;
  borderCls:  string;
  iconBgCls:  string;
  icon:       string;
  cotScore:   number;
  htfScore:   number;
  dxyScore:   number;
  total:      number;
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

  if (total >= 2)  return { tone: "confirmed_bull", label: "Confirmed Bullish", desc: "All three factors point the same way: institutional bias is bullish, and longs have full confluence behind them this week.", textCls: "text-teal-bright",  bgCls: "bg-[rgba(48,232,223,0.07)]", borderCls: "border-[rgba(48,232,223,0.22)]", iconBgCls: "bg-[rgba(48,232,223,0.22)]", icon: "trending_up",   cotScore: cot, htfScore: htf, dxyScore: dxy, total };
  if (total === 1) return { tone: "lean_bull",       label: "Bullish Lean",      desc: "Two of the three factors lean bullish, which is a usable directional edge. Confirm it with HTF structure before committing.", textCls: "text-teal",         bgCls: "bg-[rgba(8,174,170,0.06)]",  borderCls: "border-[rgba(8,174,170,0.18)]",  iconBgCls: "bg-[rgba(8,174,170,0.18)]",  icon: "arrow_upward",  cotScore: cot, htfScore: htf, dxyScore: dxy, total };
  if (total === 0) return { tone: "mixed",           label: "No Clear Bias",     desc: "The factors disagree this week, so neither COT nor trend alignment gives you an edge. Wait until they line up.", textCls: "text-gold",         bgCls: "bg-[rgba(248,185,61,0.06)]", borderCls: "border-[rgba(248,185,61,0.18)]", iconBgCls: "bg-[rgba(248,185,61,0.18)]", icon: "remove",        cotScore: cot, htfScore: htf, dxyScore: dxy, total };
  if (total === -1)return { tone: "lean_bear",       label: "Bearish Lean",      desc: "Two of the three factors lean bearish, which is a usable directional edge. Wait for an HTF structure shift before selling.", textCls: "text-coral",        bgCls: "bg-[rgba(234,82,61,0.06)]",  borderCls: "border-[rgba(234,82,61,0.18)]",  iconBgCls: "bg-[rgba(234,82,61,0.18)]",  icon: "arrow_downward",cotScore: cot, htfScore: htf, dxyScore: dxy, total };
  return               { tone: "confirmed_bear",  label: "Confirmed Bearish", desc: "All three factors point the same way: institutional bias is bearish, and shorts have full confluence behind them this week.", textCls: "text-coral-bright", bgCls: "bg-[rgba(255,89,66,0.07)]",  borderCls: "border-[rgba(255,89,66,0.22)]",  iconBgCls: "bg-[rgba(255,89,66,0.22)]",  icon: "trending_down", cotScore: cot, htfScore: htf, dxyScore: dxy, total };
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
      <div className="text-[10px] font-semibold uppercase tracking-widest text-ink-dim">{tf}</div>
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
          <span className="text-[12px] text-ink-dim">—</span>
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
        <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-dim">
          {factorLabel}
        </div>
        <div className="text-[12.5px] font-bold" style={{ color }}>{valueLabel}</div>
      </div>
    </div>
  );
}

// ── Impact dots ───────────────────────────────────────────────────────────────

const IMPACT_CLS: Record<number, string> = { 1: "bg-ink-dim", 2: "bg-gold", 3: "bg-coral" };

function ImpactDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <div key={i} className={cn("w-1.5 h-1.5 rounded-full", i <= level ? IMPACT_CLS[level] : "bg-track")} />
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
    <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-lg tracking-wide bg-panel-2 text-ink-mid border border-line">
      {code}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PairOverviewPage() {
  const { pair } = useParams<{ pair: string }>();
  const router   = useRouter();
  const P        = pair.toUpperCase();
  const { data: instruments = [], isLoading: instrumentsLoading } = useInstruments();
  const meta     = useMemo(() => deriveMetaMap(instruments)[P], [instruments, P]);

  const [cotData,     setCotData]     = useState<CotDetailResponse | null>(null);
  const [dxyData,     setDxyData]     = useState<CotDetailResponse | null>(null);
  const [calEvents,   setCalEvents]   = useState<CalEvent[]>([]);
  const [priceTick,   setPriceTick]   = useState<PriceTick | null>(null);
  const [trendMatrix, setTrendMatrix] = useState<Partial<Record<TF, Bias>>>({});
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.allSettled([
      fetch(`/api/cot/${P}`).then((r) => { if (!r.ok) throw new Error("cot unavailable"); return r.json() as Promise<CotDetailResponse>; }),
      fetch(`/api/cot/DXY`).then((r)  => { if (!r.ok) throw new Error("cot unavailable"); return r.json() as Promise<CotDetailResponse>; }),
      fetch(`/api/calendar`).then((r) => r.json() as Promise<CalEvent[]>),
      fetch(`/api/prices`).then((r)   => r.json() as Promise<PriceTick[]>),
      fetch(`/api/trend-matrix`).then((r) => r.json() as Promise<{ matrix: Record<string, Record<TF, Bias>> } | null>),
    ]).then(([cot, dxy, cal, prices, trend]) => {
      if (cot.status    === "fulfilled") setCotData(cot.value);
      if (dxy.status    === "fulfilled") setDxyData(dxy.value);
      if (cal.status    === "fulfilled") setCalEvents(cal.value);
      if (prices.status === "fulfilled") {
        const tick = (prices.value as PriceTick[]).find((t) => t.sym === P);
        if (tick) setPriceTick(tick);
      }
      if (trend.status === "fulfilled" && trend.value) {
        setTrendMatrix(trend.value.matrix[P] ?? DEFAULT_ROW);
      }
      setLoading(false);
    });
  }, [P]);

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

  // Prefer the non-USD leg for news filtering (more pair-specific); falls
  // back to USD for USD-base pairs, or undefined (general feed) if neither
  // leg is a currency MacroEdge tracks news for.
  const newsCurrency = meta?.currencies.find(
    (c) => c !== "USD" && TRACKED_CURRENCIES.includes(c as (typeof TRACKED_CURRENCIES)[number])
  ) ?? (meta?.currencies.includes("USD") ? "USD" : undefined);

  const tfs        = TFS.map((tf) => trendMatrix[tf]).filter(Boolean) as Bias[];
  const bullCount  = tfs.filter((b) => b === "bullish").length;
  const bearCount  = tfs.filter((b) => b === "bearish").length;
  const confBias   = bullCount > bearCount ? "bullish" : bearCount > bullCount ? "bearish" : "ranging";
  const confCount  = Math.max(bullCount, bearCount);
  const confTextCls = confBias === "bullish" ? "text-teal" : confBias === "bearish" ? "text-coral" : "text-gold";
  const confBgCls    = confBias === "bullish" ? "bg-teal"   : confBias === "bearish" ? "bg-coral"   : "bg-gold";

  const cotSig = cotData ? SIGNAL_CFG[cotData.signal] : null;

  if (!meta && instrumentsLoading) {
    return <div className="view" />;
  }

  if (!meta) {
    return (
      <div className="view">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 mb-5 text-[13px] font-semibold hover:opacity-75 text-ink-dim">
          <Icon name="arrow_back" size={16} /> Back
        </button>
        <div className="rounded-2xl px-5 py-4 text-[13px] bg-[rgba(234,82,61,0.07)] border border-[rgba(234,82,61,0.2)] text-coral">
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
        className="flex items-center gap-1.5 mb-5 text-[13px] font-semibold hover:opacity-75 active:scale-95 transition-all text-ink-dim"
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
            <h1 className="font-display font-bold text-[28px] tracking-[-0.025em] text-ink-strong">
              {P}
            </h1>
            <span className="text-[15px] text-ink-dim">·</span>
            <span className="text-[15px] text-ink-mid">{meta.label}</span>
            {meta.usdBase && (
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-panel-2 text-ink-dim border border-line">
                USD-base
              </span>
            )}
          </div>
          <p className="text-[13px] text-ink-dim">
            Pair overview · COT bias, trend alignment, upcoming events
          </p>
        </div>

        {/* Live price */}
        {priceTick ? (
          <div className="flex flex-col items-end shrink-0">
            <span className="font-display font-bold tabular-nums text-[24px] tracking-[-0.025em] text-ink-strong">
              {priceTick.price}
            </span>
            <span className={cn("text-[12.5px] font-semibold tabular-nums flex items-center gap-1", priceTick.chg >= 0 ? "text-teal-bright" : "text-coral-bright")}>
              <Icon name={priceTick.chg >= 0 ? "arrow_upward" : "arrow_downward"} size={12} />
              {Math.abs(priceTick.chg)}% today
            </span>
          </div>
        ) : loading ? (
          <Skeleton h={44} w={100} r={8} />
        ) : null}
      </div>

      {/* ── Weekly Bias Card ── */}
      <div className={cn("rounded-2xl px-6 py-5 mb-6 border-2", verdict.bgCls, verdict.borderCls)}>
        <div className="text-[10.5px] font-semibold uppercase tracking-widest mb-3 text-ink-dim">
          Weekly Bias · Three-Factor Confluence
        </div>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          {/* Verdict label */}
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className={cn("flex items-center justify-center rounded-xl size-9 shrink-0", verdict.iconBgCls)}>
                <Icon name={verdict.icon} size={20} fill className={verdict.textCls} />
              </div>
              <span className={cn("font-display font-bold text-[22px] tracking-[-0.02em]", verdict.textCls)}>
                {verdict.label}
              </span>
            </div>
            <p className="text-[12.5px] leading-relaxed max-w-md text-ink-mid">
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
      <div className="grid gap-5 grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">

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
                  className="flex items-center gap-1 text-[12px] font-semibold hover:opacity-75 transition-opacity text-teal"
                >
                  Edit <Icon name="open_in_new" size={12} />
                </Link>
              }
            />

            {tfs.length === 0 ? (
              <div className="flex items-start gap-3 rounded-xl px-4 py-3.5 text-[12.5px] leading-relaxed bg-[rgba(248,185,61,0.05)] border border-[rgba(248,185,61,0.18)] text-ink-mid">
                <Icon name="info" size={15} fill className="text-gold shrink-0 mt-px" />
                <span>
                  No trend data for {P}.{" "}
                  <Link href="/trend" className="text-teal underline underline-offset-2">
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
                    <div className="text-[10.5px] text-ink-dim">Confluence</div>
                    <div className={cn("font-display font-bold tabular-nums text-[22px] tracking-[-0.02em]", confTextCls)}>
                      {confCount}<span className="text-[13px] text-ink-dim">/5</span>
                    </div>
                    <div className={cn("text-[11px] font-semibold capitalize", confTextCls)}>
                      {confBias}
                    </div>
                  </div>
                </div>
                {/* Confluence bar */}
                <div className="h-[5px] rounded-[3px] bg-track overflow-hidden">
                  <div
                    className={cn("h-full rounded-[3px] transition-[width] duration-700 ease-app", confBgCls)}
                    style={{ width: `${(confCount / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </Panel>

          {/* MacroEdge Fundamentals */}
          <FundamentalsPanel pair={P} />

          {/* Economic Calendar */}
          <Panel pad={0}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <div>
                <div className="text-[15px] font-semibold text-ink-strong">
                  Economic Calendar
                </div>
                <div className="text-[12px] mt-0.5 text-ink-dim">
                  {meta.currencies.join(" + ")} events this week
                </div>
              </div>
              <Link
                href="/calendar"
                className="flex items-center gap-1 text-[12px] font-semibold hover:opacity-75 text-teal"
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
                <Icon name="event_busy" size={28} className="text-ink-dim mx-auto mb-2" />
                <div className="text-[13px] text-ink-dim">
                  No {meta.currencies.join("/")} events this week
                </div>
              </div>
            ) : (
              <>
                {relevantEvents.map((ev, i) => (
                  <div
                    key={ev.id}
                    className={cn("flex items-center gap-3 px-5 py-3", i < relevantEvents.length - 1 && "border-b border-line", ev.impact === 3 && "bg-[rgba(234,82,61,0.025)]")}
                  >
                    <ImpactDots level={ev.impact} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-medium truncate text-ink-strong">
                        {ev.event}
                      </div>
                      <div className="text-[11px] text-ink-dim">
                        {ev.date} · {fmtTime(ev.time)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-[11.5px]">
                      {ev.forecast && (
                        <span className="text-ink-dim">F: {ev.forecast}{ev.unit}</span>
                      )}
                      {ev.previous && (
                        <span className="text-ink-dim">P: {ev.previous}{ev.unit}</span>
                      )}
                      {ev.actual && (
                        <span className="text-teal-bright font-semibold">
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
                  className="flex items-center gap-1 text-[12px] font-semibold hover:opacity-75 text-teal"
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
                <div className={cn("flex items-center gap-2.5 rounded-xl px-3 py-2.5 mb-4 border", cotSig.bgCls, cotSig.borderCls)}>
                  <Icon name={cotSig.icon} size={16} fill className={cotSig.textCls} />
                  <span className={cn("font-semibold text-[13px]", cotSig.textCls)}>
                    {cotSig.label}
                  </span>
                  {meta.usdBase && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-lg bg-panel-2 text-ink-dim border border-line">
                      inverted
                    </span>
                  )}
                </div>

                {/* Ring + stats */}
                <div className="flex items-start gap-4 mb-4">
                  <Ring value={cotData.cotIndex} size={60} stroke={6} color={cotSig.strokeColor}>
                    <div className="text-center">
                      <div className={cn("font-display font-bold tabular-nums leading-none text-[16px]", cotSig.textCls)}>
                        {cotData.cotIndex}
                      </div>
                      <div className="text-[9px] leading-none mt-0.5 text-ink-dim">/100</div>
                    </div>
                  </Ring>
                  <div className="flex-1">
                    <div className="text-[10.5px] mb-1.5 text-ink-dim">COT Index · 3-year range</div>
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span className={cn("font-display font-bold tabular-nums text-[20px] tracking-[-0.02em]", cotData.wowChange >= 0 ? "text-teal-bright" : "text-coral-bright")}>
                        {fmtNet(cotData.wowChange)}
                      </span>
                      <span className="text-[11px] text-ink-dim">WoW</span>
                    </div>
                    {cotData.rows[0] && (
                      <div
                        className={cn("text-[12.5px] font-semibold tabular-nums", cotData.rows[0].largeSpecNet >= 0 ? "text-teal" : "text-coral")}
                      >
                        {fmtNet(cotData.rows[0].largeSpecNet)} net
                      </div>
                    )}
                  </div>
                </div>

                {/* 8-week sparkline */}
                {sparkData.length > 1 && (
                  <div>
                    <div className="text-[10.5px] mb-1.5 text-ink-dim">Large Spec Net · 8 weeks</div>
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
              <div className="text-[13px] text-center py-4 text-ink-dim">
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
                      <div className={cn("flex items-center gap-2 rounded-xl px-3 py-2.5 flex-1 border", dxySig.bgCls, dxySig.borderCls)}>
                        <Icon name={dxySig.icon} size={14} fill className={dxySig.textCls} />
                        <div>
                          <div className="text-[10px] uppercase tracking-wide font-semibold text-ink-dim">DXY COT</div>
                          <div className={cn("text-[12.5px] font-semibold", dxySig.textCls)}>{dxySig.label}</div>
                        </div>
                      </div>
                      <div
                        className={cn(
                          "flex items-center gap-2 rounded-xl px-3 py-2.5 border",
                          confirms ? "bg-[rgba(8,174,170,0.07)] border-[rgba(8,174,170,0.2)]" : "bg-[rgba(234,82,61,0.07)] border-[rgba(234,82,61,0.2)]"
                        )}
                      >
                        <Icon
                          name={confirms ? "check_circle" : "cancel"}
                          size={16} fill
                          className={confirms ? "text-teal" : "text-coral"}
                        />
                        <span className={cn("text-[12.5px] font-semibold", confirms ? "text-teal" : "text-coral")}>
                          {confirms ? "Confirms" : "Diverges"}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11.5px] leading-relaxed text-ink-dim">
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
            <div className="flex flex-col text-ink-dim">
              {[
                "Previous Week High",
                "Previous Week Low",
                "Previous Day High",
                "Previous Day Low",
                "Nearest Order Block",
              ].map((label, i, arr) => (
                <div
                  key={label}
                  className={cn("flex items-center justify-between py-2.5 text-[12.5px]", i < arr.length - 1 && "border-b border-line")}
                >
                  <span>{label}</span>
                  <span className="tabular-nums text-ink-dim">—</span>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-xl px-3 py-2.5 flex items-center gap-2 text-[11.5px] bg-[rgba(248,185,61,0.05)] border border-[rgba(248,185,61,0.15)] text-gold">
              <Icon name="construction" size={13} />
              Manual entry or journal integration coming soon
            </div>
          </Panel>

          {/* News */}
          <NewsFeed currency={newsCurrency} />
        </div>
      </div>
    </div>
  );
}
