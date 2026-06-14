"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useTrades, useAddTrade } from "@/lib/hooks/useTrades";
import {
  Panel, PanelHead, StatTile, DirPill, Chip, Avatar,
  Button, Ring, Sparkline, Icon, CandleChart, EmptyState,
} from "@/components/ui";
import type { Candle, Zone, PriceLine, Mark } from "@/components/ui";

// ── Candle generator (seeded RNG — matches design reference) ──────────────────
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function genCandles(seed: number, n: number, start: number, vol: number, drift: number): Candle[] {
  const rnd = mulberry32(seed);
  const out: Candle[] = [];
  let price = start;
  for (let i = 0; i < n; i++) {
    const o = price;
    const d = (rnd() - 0.5 + drift) * 2;
    const body = d * vol * (0.4 + rnd());
    const c = o + body;
    const h = Math.max(o, c) + rnd() * vol * 0.9;
    const l = Math.min(o, c) - rnd() * vol * 0.9;
    out.push({ o, h, l, c });
    price = c;
  }
  return out;
}

// ── Static dashboard data ─────────────────────────────────────────────────────
const FEAT = {
  id: "a1",
  pair: "XAUUSD",
  dir: "long" as const,
  model: "Liquidity Sweep → FVG",
  session: "London",
  rr: "3.1",
  entry: "2,331.50",
  sl: "2,326.10",
  tp1: "2,344.00",
  tags: ["FVG", "Sweep", "Discount"],
  title:
    "Price swept Asian lows into the 4H bullish FVG sitting in discount. M5 CHoCH confirmed — looking for continuation to TP1 at PDH.",
  reactions: 24,
  taken: 11,
  time: "08:42",
};

const DISCIPLINE_ROWS: [string, boolean][] = [
  ["Rules checklist run", true],
  ["Risk ≤ 1% kept",      true],
  ["No revenge trades",   true],
  ["SL untouched",        false],
];

const CAL_EVENTS = [
  { time: "09:30", cur: "USD", event: "Core CPI m/m",           impact: "high"   },
  { time: "10:00", cur: "EUR", event: "ECB President Speech",    impact: "high"   },
  { time: "13:30", cur: "GBP", event: "BoE Governor Bailey",     impact: "medium" },
];

const TREND_DATA = [
  { pair: "EURUSD", tfs: ["bull","bull","bull","neutral","bear"],  bias: "Bullish"  },
  { pair: "GBPUSD", tfs: ["bull","bull","neutral","bear","bear"],  bias: "Bullish"  },
  { pair: "XAUUSD", tfs: ["bull","bull","bull","bull","bull"],     bias: "Bullish"  },
  { pair: "NZDUSD", tfs: ["bear","bear","neutral","bear","bear"],  bias: "Bearish"  },
  { pair: "NAS100", tfs: ["bear","neutral","bear","bear","bull"],  bias: "Bearish"  },
];

const TF_LABELS = ["M15", "H1", "H4", "D1", "W1"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getSessionLabel() {
  const h = new Date().getUTCHours();
  if (h < 8)  return "Asia Session";
  if (h < 13) return "London Session";
  if (h < 17) return "London / NY Overlap";
  if (h < 22) return "New York Session";
  return "Pre-Market";
}

function getDayLabel() {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

function fmtR(r: number) {
  return (r > 0 ? "+" : "") + r.toFixed(1) + "R";
}

function rColor(r: number) {
  return r > 0 ? "var(--teal-bright)" : r < 0 ? "var(--coral-bright)" : "var(--ink-mid)";
}

// ── Responsive Sparkline wrapper ──────────────────────────────────────────────
function EquityCurve({ data }: { data: number[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((e) => setWidth(e[0].contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full">
      <Sparkline data={data} width={width} height={128} color="var(--teal-bright)" strokeW={2.5} />
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function Dashboard() {
  const { user, journaledAlerts, addJournaledAlert, toast } = useStore();
  const { trades, stats } = useTrades();
  const { mutate: addTrade } = useAddTrade();

  const handleCopyAlert = () => {
    if (journaledAlerts.has(FEAT.id)) { toast("Already in your journal", "gold", "info"); return; }
    addTrade({
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      pair: FEAT.pair,
      dir: FEAT.dir,
      model: FEAT.model,
      session: FEAT.session,
      rr: parseFloat(FEAT.rr),
      result: "open",
      pnlR: 0,
      tags: FEAT.tags,
      note: `From Kondwani's alert · Entry ${FEAT.entry} / SL ${FEAT.sl} / TP ${FEAT.tp1}`,
      fromAlert: FEAT.id,
      discipline: true,
    });
    addJournaledAlert(FEAT.id);
    toast(`${FEAT.pair} setup copied to journal`, "teal", "add_task");
  };

  const journaled = journaledAlerts.has(FEAT.id);

  const candles = useMemo(() => genCandles(42, 56, 2330, 2.6, 0.04), []);

  const annotations = useMemo(() => {
    const asiaLow = Math.min(...candles.map((c) => c.l)) + 0.6;
    return {
      zones:  [{ i0: 30, i1: 38, lo: 2330.5, hi: 2333.2, type: "fvg" as const, dir: "long" as const }] as Zone[],
      lines:  [{ price: asiaLow, label: "ASIA LOW — swept", color: "var(--coral-bright)" }] as PriceLine[],
      marks:  [{ i: 41, price: candles[41].c, label: "CHoCH", type: "choch" as const }] as Mark[],
    };
  }, [candles]);

  const eq = stats.equity.length > 1 ? stats.equity : [0, 0.5, 1, 0.7, 1.4, 2.1, 1.8, 2.6];

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div>
          <div
            className="text-[11px] font-semibold uppercase tracking-[0.26em] mb-1.5"
            style={{ color: "var(--teal)" }}
          >
            {getDayLabel()} · {getSessionLabel()}
          </div>
          <h1
            className="font-display font-normal leading-tight"
            style={{ fontSize: 28, color: "var(--ink-strong)", letterSpacing: "-0.02em" }}
          >
            {getGreeting()},{" "}
            <span className="font-bold">{user?.name?.split(" ")[0] ?? "Trader"}</span>
          </h1>
        </div>
        <Button variant="primary" icon="add">Log a trade</Button>
      </div>

      {/* ── Stat tiles ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        <StatTile
          label="Net this month"
          value={fmtR(stats.netR)}
          sub={`≈ ${(stats.netR * 0.5).toFixed(1)}% · 0.5% risk`}
          tone={stats.netR >= 0 ? "up" : "down"}
          icon="show_chart"
        />
        <StatTile
          label="Win rate"
          value={stats.winRate + "%"}
          sub={`${stats.closed} closed trades`}
          tone="neutral"
          icon="target"
        />
        <StatTile
          label="Expectancy"
          value={stats.closed > 0 ? (stats.expectancy > 0 ? `+${stats.expectancy}R` : `${stats.expectancy}R`) : "—"}
          sub="expected R per trade"
          tone={stats.expectancy > 0 ? "up" : stats.expectancy < 0 ? "down" : "neutral"}
          icon="trending_up"
        />
        <StatTile
          label="Discipline"
          value={stats.discFollowed + "/100"}
          sub="rules followed"
          tone={stats.discFollowed >= 90 ? "gold" : "neutral"}
          icon="verified"
        />
        <StatTile
          label="Journal streak"
          value={(user?.streak ?? 0) + " days"}
          sub="keep it alive"
          tone={(user?.streak ?? 0) >= 3 ? "gold" : "up"}
          icon="local_fire_department"
        />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)] gap-4">

        {/* ── Left column ── */}
        <div className="flex flex-col gap-4 min-w-0">

          {/* Featured alert */}
          <Panel pad={0} style={{ overflow: "hidden" }}>
            {/* Card header */}
            <div
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: "1px solid var(--line)" }}
            >
              <div className="flex items-center gap-3">
                <Avatar seed={3} name="Kondwani" size={36} ring="var(--gold)" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[13.5px]" style={{ color: "var(--ink-strong)" }}>
                      Kondwani
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                      style={{ background: "var(--gold)", color: "var(--navy-deep)" }}
                    >
                      Lead Trader
                    </span>
                  </div>
                  <div className="text-[11.5px] mt-0.5" style={{ color: "var(--ink-dim)" }}>
                    Posted a live setup · {FEAT.time}
                  </div>
                </div>
              </div>
              {/* LIVE indicator */}
              <div
                className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-widest uppercase"
                style={{ color: "var(--teal-bright)" }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: "var(--teal-bright)", animation: "var(--animate-live)" }}
                />
                LIVE
              </div>
            </div>

            {/* Card body */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-2.5 flex-wrap mb-2.5">
                <span className="font-display font-bold text-[17px]" style={{ color: "var(--ink-strong)" }}>
                  {FEAT.pair}
                </span>
                <DirPill dir={FEAT.dir} />
                <Chip tone="teal">{FEAT.model}</Chip>
                <Chip>{FEAT.session} KZ</Chip>
              </div>
              <p className="text-[13.5px] leading-relaxed mb-4" style={{ color: "var(--ink)" }}>
                {FEAT.title}
              </p>

              <CandleChart candles={candles} height={228} annotations={annotations} />

              {/* Entry stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
                {(
                  [
                    ["Entry", FEAT.entry, "var(--ink-strong)"],
                    ["Stop",  FEAT.sl,    "var(--coral-bright)"],
                    ["TP1",   FEAT.tp1,   "var(--teal-bright)"],
                    ["R:R",   FEAT.rr + "R", "var(--gold)"],
                  ] as [string, string, string][]
                ).map(([label, val, color]) => (
                  <div key={label} className="rounded-xl p-3" style={{ background: "var(--panel-2)" }}>
                    <div
                      className="text-[10px] uppercase tracking-widest font-semibold mb-1"
                      style={{ color: "var(--ink-dim)" }}
                    >
                      {label}
                    </div>
                    <div
                      className="font-semibold text-[14.5px] tabular-nums"
                      style={{ color }}
                    >
                      {val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2.5 mt-4 flex-wrap">
                <Button
                  variant="primary"
                  size="sm"
                  icon={journaled ? "check" : "content_copy"}
                  disabled={journaled}
                  onClick={handleCopyAlert}
                >
                  {journaled ? "In journal" : "Copy to journal"}
                </Button>
                <Link href="/alerts">
                  <Button variant="ghost" size="sm" icon="open_in_full">View setup</Button>
                </Link>
                <div className="ml-auto flex items-center gap-4 text-[12px]" style={{ color: "var(--ink-dim)" }}>
                  <span className="flex items-center gap-1.5">
                    <Icon name="favorite" size={14} fill style={{ color: "var(--coral)" }} />
                    {FEAT.reactions}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Icon name="bolt" size={14} />
                    {FEAT.taken} took it
                  </span>
                </div>
              </div>
            </div>
          </Panel>

          {/* Equity curve */}
          <Panel pad={0} style={{ overflow: "hidden" }}>
            {trades.length === 0 ? (
              <EmptyState
                icon="candlestick_chart"
                title="No trades logged yet"
                body="Log your first trade to start building your performance history."
              />
            ) : (
              <>
                <div className="px-5 pt-4">
                  <PanelHead
                    title="Equity curve"
                    sub={`Cumulative R · ${stats.closed} closed trades`}
                    icon="monitoring"
                    action={
                      <div
                        className="font-display font-bold text-[19px]"
                        style={{ color: rColor(stats.netR), fontFeatureSettings: '"tnum"' }}
                      >
                        {fmtR(stats.netR)}
                      </div>
                    }
                  />
                </div>
                <EquityCurve data={eq} />
              </>
            )}
          </Panel>
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-4 min-w-0">

          {/* Discipline score */}
          <Panel>
            <PanelHead title="Discipline score" icon="psychology" />
            <div className="flex items-center gap-4">
              <Ring value={stats.discFollowed} max={100} size={92} stroke={8} color="var(--gold)">
                <div className="text-center">
                  <div
                    className="font-display font-bold text-[22px] leading-none"
                    style={{ color: "var(--ink-strong)", fontFeatureSettings: '"tnum"' }}
                  >
                    {stats.discFollowed}
                  </div>
                  <div
                    className="text-[10px] uppercase tracking-widest mt-0.5"
                    style={{ color: "var(--ink-dim)" }}
                  >
                    /100
                  </div>
                </div>
              </Ring>
              <div className="flex flex-col gap-2.5 flex-1 min-w-0">
                {DISCIPLINE_ROWS.map(([label, ok]) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 text-[12px] leading-none"
                    style={{ color: ok ? "var(--ink)" : "var(--ink-dim)" }}
                  >
                    <Icon
                      name={ok ? "check_circle" : "cancel"}
                      size={14}
                      fill
                      style={{ color: ok ? "var(--teal-bright)" : "var(--coral-bright)", flexShrink: 0 }}
                    />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          {/* High-impact calendar */}
          <Panel>
            <PanelHead
              title="High-impact today"
              icon="event"
              action={
                <Link
                  href="/calendar"
                  className="text-[12px] font-medium"
                  style={{ color: "var(--teal)" }}
                >
                  Calendar →
                </Link>
              }
            />
            <div className="flex flex-col">
              {CAL_EVENTS.map((ev, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 py-2.5"
                  style={{ borderBottom: i < CAL_EVENTS.length - 1 ? "1px solid var(--line)" : "none" }}
                >
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ background: ev.impact === "high" ? "var(--coral)" : "var(--gold)" }}
                  />
                  <span
                    className="text-[11px] shrink-0 tabular-nums"
                    style={{ color: "var(--ink-dim)", width: 36 }}
                  >
                    {ev.time}
                  </span>
                  <Chip tone="neutral" style={{ fontSize: 10, padding: "2px 7px" }}>{ev.cur}</Chip>
                  <span
                    className="text-[12.5px] min-w-0 truncate"
                    style={{ color: "var(--ink)" }}
                  >
                    {ev.event}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Trend snapshot */}
          <Panel>
            <PanelHead
              title="Trend snapshot"
              icon="ssid_chart"
              action={
                <Link
                  href="/trend"
                  className="text-[12px] font-medium"
                  style={{ color: "var(--teal)" }}
                >
                  Matrix →
                </Link>
              }
            />
            {/* TF header labels */}
            <div className="flex items-center gap-1.5 mb-2" style={{ paddingLeft: "clamp(48px, 17%, 68px)" }}>
              {TF_LABELS.map((tf) => (
                <div
                  key={tf}
                  className="flex-1 text-center text-[9.5px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--ink-dim)" }}
                >
                  {tf}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {TREND_DATA.map(({ pair, tfs, bias }) => (
                <div key={pair} className="flex items-center gap-1.5">
                  <span
                    className="text-[12px] font-semibold shrink-0"
                    style={{ color: "var(--ink-strong)", width: 60 }}
                  >
                    {pair}
                  </span>
                  <div className="flex gap-1 flex-1">
                    {tfs.map((d, i) => (
                      <div
                        key={i}
                        className="flex-1 h-[18px] rounded"
                        style={{
                          background:
                            d === "bull" ? "rgba(8,174,170,0.25)" :
                            d === "bear" ? "rgba(234,82,61,0.25)" :
                            "var(--track)",
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className="text-[11px] font-semibold text-right shrink-0"
                    style={{
                      width: 50,
                      color:
                        bias === "Bullish" ? "var(--teal-bright)" :
                        bias === "Bearish" ? "var(--coral-bright)" :
                        "var(--gold)",
                    }}
                  >
                    {bias}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

        </div>
      </div>
    </div>
  );
}
