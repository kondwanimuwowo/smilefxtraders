"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { format, parseISO, getHours, getUTCHours, getUTCMinutes, fmtRelative, fmtMonthDay, fmtISODate, fmtWeekdayLong, fmtTime, isForexClosed, hoursUntilForexReopen } from "@/lib/date";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import { useTrades, useAddTrade } from "@/lib/hooks/useTrades";
import {
  Panel, PanelHead, StatTile, DirPill, Chip, Avatar,
  Button, Ring, Sparkline, Icon, CandleChart, EmptyState,
} from "@/components/ui";
import type { Candle, Zone, PriceLine, Mark } from "@/components/ui";
import type { InstructorAlert } from "@/app/(app)/alerts/Alerts";
import type { CalEvent } from "@/app/api/calendar/route";

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

// ── Featured alert ────────────────────────────────────────────────────────────

const PAIR_META: Record<string, { vol: number }> = {
  EURUSD: { vol: 0.0006 },
  GBPUSD: { vol: 0.0008 },
  USDJPY: { vol: 0.15   },
  USDCHF: { vol: 0.0006 },
  AUDUSD: { vol: 0.0006 },
  NZDUSD: { vol: 0.0005 },
  USDCAD: { vol: 0.0007 },
  XAUUSD: { vol: 2.5    },
  NAS100: { vol: 50     },
};

function strSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function useFeaturedAlert() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const res = await fetch("/api/alerts");
      if (!res.ok) return [] as InstructorAlert[];
      return res.json() as Promise<InstructorAlert[]>;
    },
    select: (alerts: InstructorAlert[]) =>
      alerts.find((a) => a.status === "active") ?? null,
    staleTime: 60_000,
  });
}

function buildFeaturedChart(alert: InstructorAlert): {
  candles: Candle[];
  annotations: { zones: Zone[]; lines: PriceLine[]; marks: Mark[] };
} {
  const seed   = strSeed(alert.id);
  const entry  = parseFloat(alert.entry.replace(/,/g, ""));
  const sl     = parseFloat(alert.sl.replace(/,/g, ""));
  const tp1    = parseFloat(alert.tp1.replace(/,/g, ""));
  const vol    = PAIR_META[alert.pair]?.vol ?? 0.001;
  const drift  = alert.dir === "long" ? 0.04 : -0.04;
  const candles = genCandles(seed, 56, entry, vol, drift);

  const fvgIdx = 28;
  const zones: Zone[] = [{
    i0: fvgIdx, i1: fvgIdx + 6,
    lo: Math.min(candles[fvgIdx].l, candles[fvgIdx + 1].l),
    hi: Math.max(candles[fvgIdx].h, candles[fvgIdx + 1].h),
    type: "fvg", dir: alert.dir,
  }];

  const lines: PriceLine[] = [
    { price: entry, label: "Entry", color: alert.dir === "long" ? "var(--teal)"         : "var(--coral)"       },
    { price: sl,    label: "SL",    color: "var(--coral-bright)" },
    { price: tp1,   label: "TP1",   color: "var(--teal-bright)"  },
  ];

  const bosIdx = 44;
  const marks: Mark[] = [{
    i: bosIdx,
    price: alert.dir === "long" ? candles[bosIdx].h : candles[bosIdx].l,
    label: "BOS", type: "bos",
  }];

  return { candles, annotations: { zones, lines, marks } };
}

function FeaturedAlertCard() {
  const { journaledAlerts, addJournaledAlert, toast } = useStore();
  const { mutate: addTrade } = useAddTrade();
  const { data: alert, isLoading } = useFeaturedAlert();

  const chart = useMemo(
    () => (alert ? buildFeaturedChart(alert) : null),
    [alert]
  );

  if (isLoading) {
    return (
      <Panel pad={0} style={{ overflow: "hidden" }}>
        <div className="animate-pulse">
          <div className="h-14 border-b" style={{ background: "var(--panel-2)", borderColor: "var(--line)" }} />
          <div className="p-5 space-y-3">
            <div className="h-4 w-2/3 rounded-lg" style={{ background: "var(--track)" }} />
            <div className="h-3 w-full rounded-lg" style={{ background: "var(--track)" }} />
            <div className="h-56 rounded-xl" style={{ background: "var(--track)" }} />
          </div>
        </div>
      </Panel>
    );
  }

  if (!alert || !chart) {
    return (
      <Panel pad={0} style={{ overflow: "hidden" }}>
        <EmptyState
          icon="notifications_active"
          title="No active setup right now"
          body="Kondwani will post the next live setup here when a high-probability entry appears."
        />
      </Panel>
    );
  }

  const postedTime = fmtTime(alert.timePosted);
  const journaled = journaledAlerts.has(alert.id);

  function handleCopy() {
    if (!alert) return;
    if (journaled) { toast("Already in your journal", "gold", "info"); return; }
    addTrade({
      date:       format(new Date(), "dd MMM"),
      pair:       alert.pair,
      dir:        alert.dir,
      model:      alert.model,
      session:    alert.session,
      rr:         parseFloat(alert.rr),
      result:     "open",
      pnlR:       0,
      tags:       alert.tags,
      note:       `From Kondwani's alert · Entry ${alert.entry} / SL ${alert.sl} / TP ${alert.tp1}`,
      fromAlert:  alert.id,
      discipline: true,
    });
    addJournaledAlert(alert.id);
    toast(`${alert.pair} setup copied to journal`, "teal", "add_task");
  }

  return (
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
              Posted a live setup · {postedTime}
            </div>
          </div>
        </div>
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
            {alert.pair}
          </span>
          <DirPill dir={alert.dir} />
          <Chip tone="teal">{alert.model}</Chip>
          <Chip>{alert.session} KZ</Chip>
          {alert.tags.map((t) => <Chip key={t}>{t}</Chip>)}
        </div>
        {alert.note && (
          <p className="text-[13.5px] leading-relaxed mb-4" style={{ color: "var(--ink)" }}>
            {alert.note}
          </p>
        )}

        <CandleChart candles={chart.candles} height={228} annotations={chart.annotations} />

        {/* Entry stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
          {(
            [
              ["Entry", alert.entry,           alert.dir === "long" ? "var(--teal)" : "var(--coral)"],
              ["Stop",  alert.sl,              "var(--coral-bright)"],
              ["TP1",   alert.tp1,             "var(--teal-bright)"],
              ["R:R",   alert.rr + "R",        "var(--gold)"],
            ] as [string, string, string][]
          ).map(([label, val, color]) => (
            <div key={label} className="rounded-xl p-3" style={{ background: "var(--panel-2)" }}>
              <div className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: "var(--ink-dim)" }}>
                {label}
              </div>
              <div className="font-semibold text-[14.5px] tabular-nums" style={{ color }}>
                {val}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 mt-4 flex-wrap">
          <Button
            variant="primary" size="sm"
            icon={journaled ? "check" : "content_copy"}
            disabled={journaled}
            onClick={handleCopy}
          >
            {journaled ? "In journal" : "Copy to journal"}
          </Button>
          <Link href="/alerts">
            <Button variant="ghost" size="sm" icon="open_in_full">View setup</Button>
          </Link>
          <div className="ml-auto flex items-center gap-4 text-[12px]" style={{ color: "var(--ink-dim)" }}>
            <span className="flex items-center gap-1.5">
              <Icon name="favorite" size={14} fill style={{ color: "var(--coral)" }} />
              {alert.reactions ?? 0}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="bolt" size={14} />
              {alert.taken ?? 0} took it
            </span>
          </div>
        </div>
      </div>
    </Panel>
  );
}


// ── Today's high-impact events ────────────────────────────────────────────────

const IMPACT_COLOR: Record<number, string> = { 3: "var(--coral)", 2: "var(--gold)", 1: "var(--ink-dim)" };

function useTodayEvents() {
  return useQuery({
    queryKey: ["calendar", "today"],
    queryFn: async () => {
      const res = await fetch("/api/calendar");
      if (!res.ok) return [] as CalEvent[];
      const all: CalEvent[] = await res.json();
      const today = fmtISODate(new Date());
      return all
        .filter((e) => e.date === today && e.impact >= 2)
        .sort((a, b) => a.time.localeCompare(b.time));
    },
    staleTime: 30 * 60_000,
  });
}

// ── Trend snapshot — fetched from API (instructor publishes, everyone reads) ───

const TREND_PAIRS = ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "NZDUSD", "USDCAD", "XAUUSD", "NAS100"] as const;
const TREND_TFS   = ["MN", "W", "D", "H4", "H1"] as const;

type TrendBias = "bullish" | "bearish" | "ranging";
type TrendMatrixData = Record<string, Record<string, TrendBias>>;

const TREND_DEFAULT: TrendMatrixData = {
  EURUSD: { MN: "bullish",  W: "bullish",  D: "bearish", H4: "bullish", H1: "bullish"  },
  GBPUSD: { MN: "bullish",  W: "ranging",  D: "ranging", H4: "bearish", H1: "bearish"  },
  USDJPY: { MN: "bullish",  W: "bullish",  D: "bullish", H4: "ranging", H1: "ranging"  },
  USDCHF: { MN: "bearish",  W: "ranging",  D: "ranging", H4: "bullish", H1: "bullish"  },
  AUDUSD: { MN: "bearish",  W: "bearish",  D: "ranging", H4: "bearish", H1: "ranging"  },
  NZDUSD: { MN: "bearish",  W: "bearish",  D: "bearish", H4: "bearish", H1: "ranging"  },
  USDCAD: { MN: "bullish",  W: "ranging",  D: "bullish", H4: "bullish", H1: "ranging"  },
  XAUUSD: { MN: "bullish",  W: "bullish",  D: "bullish", H4: "bullish", H1: "bullish"  },
  NAS100: { MN: "bullish",  W: "bullish",  D: "ranging", H4: "ranging", H1: "bearish"  },
};

function useTrendSnapshot() {
  const [matrix, setMatrix]       = useState<TrendMatrixData>(TREND_DEFAULT);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/trend-matrix")
      .then((r) => r.json())
      .then((data: { matrix: TrendMatrixData; updatedAt: string } | null) => {
        if (data?.matrix) setMatrix(data.matrix);
        if (data?.updatedAt) setUpdatedAt(data.updatedAt);
      })
      .catch(() => {/* keep defaults */});
  }, []);

  const rows = TREND_PAIRS.map((pair) => {
    const row = matrix[pair] ?? TREND_DEFAULT[pair];
    const counts = { bullish: 0, bearish: 0, ranging: 0 };
    TREND_TFS.forEach((tf) => { counts[row[tf] as TrendBias]++; });
    const bias: string = counts.bullish > counts.bearish
      ? "Bullish" : counts.bearish > counts.bullish
      ? "Bearish" : "Neutral";
    const tfs = TREND_TFS.map((tf) => row[tf] as TrendBias);
    return { pair, tfs, bias };
  });

  return { rows, updatedAt };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = getHours(new Date());
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getSessionLabel() {
  const now = new Date();
  if (isForexClosed(now)) return "Market Closed";
  const h = getUTCHours(now);
  if (h < 8)  return "Asia Session";
  if (h < 13) return "London Session";
  if (h < 17) return "London / NY Overlap";
  if (h < 22) return "New York Session";
  return "Pre-Market";
}

function getDayLabel() {
  return fmtWeekdayLong(new Date());
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

// ── Active Trades Panel ───────────────────────────────────────────────────────
function ActiveTradesPanel() {
  const { trades } = useTrades();
  const active = trades.filter((t) => t.result.toLowerCase() === "open");

  if (active.length === 0) return null;

  return (
    <Panel pad={0} style={{ overflow: "hidden" }}>
      <div className="px-5 pt-4 pb-3">
        <PanelHead title="Active Positions" icon="radar" style={{ marginBottom: 0 }} />
      </div>
      <div className="flex flex-col">
        {active.map((t, i) => {
          const isLong = t.dir.toLowerCase() === "long";
          const dirColor = isLong ? "var(--teal)" : "var(--coral)";
          return (
            <div
              key={t.id}
              className="relative flex items-center gap-4 px-5 py-3.5"
              style={{
                borderTop: i > 0 ? "1px solid var(--line)" : "none",
                background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
              }}
            >
              {/* Direction accent bar */}
              <div
                className="absolute left-0 top-3 bottom-3 rounded-r-full"
                style={{ width: 3, background: dirColor, opacity: 0.7 }}
              />

              {/* Pair + direction */}
              <div className="flex flex-col gap-1 min-w-[90px] shrink-0">
                <div className="flex items-center gap-2">
                  <span
                    className="font-bold text-[15px] tracking-tight"
                    style={{ color: "var(--ink-strong)", fontFamily: "var(--font-display)" }}
                  >
                    {t.pair}
                  </span>
                  <DirPill dir={t.dir} size="sm" />
                </div>
                {t.model && (
                  <span
                    className="text-[10px] font-medium truncate"
                    style={{ color: "var(--ink-dim)", maxWidth: 110 }}
                  >
                    {t.model}
                  </span>
                )}
              </div>

              {/* Price levels */}
              <div
                className="flex-1 grid gap-x-4 gap-y-0.5 tabular-nums text-[11px]"
                style={{ gridTemplateColumns: "repeat(3, auto)", fontFamily: "var(--mono)", color: "var(--ink-dim)" }}
              >
                <span style={{ color: dirColor, fontWeight: 600 }}>
                  {t.entryPrice ?? "—"}
                </span>
                <span>{t.stopLoss ?? "—"}</span>
                <span>{t.takeProfit ?? "—"}</span>

                <span style={{ fontSize: 9, opacity: 0.6, letterSpacing: "0.04em" }}>ENTRY</span>
                <span style={{ fontSize: 9, opacity: 0.6, letterSpacing: "0.04em" }}>SL</span>
                <span style={{ fontSize: 9, opacity: 0.6, letterSpacing: "0.04em" }}>TP</span>
              </div>

              {/* Right: R:R + date */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {t.rr != null && (
                  <span
                    className="text-[11px] font-bold tabular-nums"
                    style={{ color: "var(--gold)", fontFamily: "var(--mono)" }}
                  >
                    {t.rr}R
                  </span>
                )}
                <span
                  className="text-[10px] tabular-nums"
                  style={{ color: "var(--ink-dim)", fontFamily: "var(--mono)" }}
                >
                  {t.openedAt ? fmtMonthDay(t.openedAt) : t.date}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer pulse */}
      <div
        className="flex items-center gap-2 px-5 py-2.5"
        style={{ borderTop: "1px solid var(--line)", background: "rgba(248,185,61,0.03)" }}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--gold)", boxShadow: "0 0 6px var(--gold)", animation: "live-pulse 2s infinite" }}
        />
        <span className="text-[10.5px] font-semibold uppercase tracking-widest" style={{ color: "var(--gold)", letterSpacing: "0.1em" }}>
          {active.length} position{active.length !== 1 ? "s" : ""} live
        </span>
      </div>
    </Panel>
  );
}

// ── Session status card (compact, for right-column) ──────────────────────────

const SESSION_DEFS = [
  { name: "Sydney",    flag: "🇦🇺", open: 23, close: 8,  color: "var(--ink-mid)",      closeL: "08:00" },
  { name: "Tokyo",     flag: "🇯🇵", open: 2,  close: 11, color: "var(--gold)",          closeL: "11:00" },
  { name: "Frankfurt", flag: "🇩🇪", open: 8,  close: 17, color: "var(--teal)",          closeL: "17:00" },
  { name: "London",    flag: "🇬🇧", open: 9,  close: 18, color: "var(--teal-bright)",   closeL: "18:00" },
  { name: "New York",  flag: "🇺🇸", open: 14, close: 23, color: "var(--coral-bright)",  closeL: "23:00" },
] as const;

function nowGMT2() {
  const d = new Date();
  return ((d.getUTCHours() + 2) % 24) + d.getUTCMinutes() / 60;
}

function sessionActive(open: number, close: number, h: number) {
  return open < close ? h >= open && h < close : h >= open || h < close;
}

function sessionHoursUntil(target: number, from: number) {
  const d = target - from;
  return d < 0 ? d + 24 : d;
}

function fmtCountdown(totalH: number) {
  const h = Math.floor(totalH);
  const m = Math.round((totalH - h) * 60);
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function SessionCard() {
  const [gmt2,   setGmt2]   = useState<number | null>(null);
  const [closed, setClosed] = useState(false);
  const [reopenH, setReopenH] = useState(0);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setGmt2(nowGMT2());
      setClosed(isForexClosed(now));
      setReopenH(hoursUntilForexReopen(now));
    };
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, []);

  if (gmt2 === null) return null;

  // Over the weekend the market is closed — no session is active regardless of
  // the hour, so don't surface London/NY as "open".
  const open = closed ? [] : SESSION_DEFS.filter((s) => sessionActive(s.open, s.close, gmt2));
  const isKillzone = !closed && gmt2 >= 14 && gmt2 < 18; // London + NY overlap

  // Next session: first one that isn't active, sorted by soonest open. While
  // closed, the daily cycle is meaningless — we show the weekend reopen instead.
  const next = closed
    ? undefined
    : SESSION_DEFS
        .filter((s) => !sessionActive(s.open, s.close, gmt2))
        .sort((a, b) => sessionHoursUntil(a.open, gmt2) - sessionHoursUntil(b.open, gmt2))[0];

  const timeLabel = `${String(Math.floor(gmt2) % 24).padStart(2, "0")}:${String(Math.round((gmt2 % 1) * 60)).padStart(2, "0")}`;

  return (
    <Panel pad={0}>
      <div className="px-4 py-3.5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-rounded"
              style={{ fontSize: 14, color: "var(--ink-dim)", fontVariationSettings: "'FILL' 1" }}
            >
              schedule
            </span>
            <span className="text-[12px] font-semibold" style={{ color: "var(--ink-strong)", fontFamily: "var(--font-display)" }}>
              Sessions
            </span>
            {isKillzone && (
              <span
                className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(48,232,223,0.08)", color: "var(--teal-bright)", border: "1px solid rgba(48,232,223,0.22)", letterSpacing: "0.08em" }}
              >
                Killzone
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] tabular-nums font-semibold" style={{ color: "var(--ink-strong)", fontFamily: "var(--mono)" }}>
              {timeLabel}
            </span>
            <span className="text-[8.5px] font-bold uppercase px-1 py-0.5 rounded" style={{ background: "var(--panel-2)", color: "var(--ink-dim)", border: "1px solid var(--line)", letterSpacing: "0.08em" }}>
              GMT+2
            </span>
          </div>
        </div>

        {/* Active sessions */}
        {open.length === 0 ? (
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="size-1.5 rounded-full shrink-0" style={{ background: "var(--ink-dim)" }} />
            <span className="text-[12px]" style={{ color: "var(--ink-dim)" }}>
              {closed ? "Closed for the weekend" : "Market closed"}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 mb-2.5">
            {open.map((s) => (
              <div key={s.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className="size-1.5 rounded-full shrink-0"
                    style={{ background: s.color, boxShadow: `0 0 4px ${s.color}` }}
                  />
                  <span style={{ fontSize: 12 }}>{s.flag}</span>
                  <span className="text-[12.5px] font-semibold" style={{ color: s.color }}>
                    {s.name}
                  </span>
                  <span className="text-[9.5px] font-bold uppercase tracking-widest" style={{ color: s.color, opacity: 0.7 }}>
                    open
                  </span>
                </div>
                <span className="text-[11px] tabular-nums" style={{ color: "var(--ink-dim)", fontFamily: "var(--mono)" }}>
                  closes {s.closeL}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="my-2.5" style={{ height: 1, background: "var(--line)", opacity: 0.5 }} />

        {/* Next session + link */}
        <div className="flex items-center justify-between gap-2">
          {closed ? (
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-rounded" style={{ fontSize: 13, color: "var(--ink-dim)" }}>
                arrow_forward
              </span>
              <span className="text-[12px]" style={{ color: "var(--ink-dim)" }}>
                Reopens in{" "}
                <span className="font-semibold tabular-nums" style={{ color: "var(--ink-strong)", fontFamily: "var(--mono)" }}>
                  {fmtCountdown(reopenH)}
                </span>
              </span>
            </div>
          ) : next ? (
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-rounded" style={{ fontSize: 13, color: "var(--ink-dim)" }}>
                arrow_forward
              </span>
              <span style={{ fontSize: 12 }}>{next.flag}</span>
              <span className="text-[12px]" style={{ color: "var(--ink-dim)" }}>
                {next.name} in{" "}
                <span className="font-semibold tabular-nums" style={{ color: "var(--ink-strong)", fontFamily: "var(--mono)" }}>
                  {fmtCountdown(sessionHoursUntil(next.open, gmt2))}
                </span>
              </span>
            </div>
          ) : (
            <div />
          )}
          <Link href="/sessions" className="text-[11.5px] font-medium" style={{ color: "var(--teal)" }}>
            All sessions →
          </Link>
        </div>
      </div>
    </Panel>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function Dashboard() {
  const { user } = useStore();
  const { trades, stats } = useTrades();
  const { data: todayEvents = [], isLoading: eventsLoading } = useTodayEvents();
  const { rows: trendRows, updatedAt: trendUpdatedAt } = useTrendSnapshot();

  // Last 4 trades for discipline checklist
  const recentTrades = trades.slice(0, 4);

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

          {/* User's own active trades */}
          <ActiveTradesPanel />

          {/* Featured alert — live from API */}
          <FeaturedAlertCard />

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
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                {recentTrades.length === 0 ? (
                  <div className="text-[12px]" style={{ color: "var(--ink-dim)" }}>
                    No trades logged yet
                  </div>
                ) : (
                  recentTrades.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 text-[12px] leading-none"
                      style={{ color: t.discipline ? "var(--ink)" : "var(--ink-dim)" }}
                    >
                      <Icon
                        name={t.discipline ? "check_circle" : "cancel"}
                        size={14}
                        fill
                        style={{ color: t.discipline ? "var(--teal-bright)" : "var(--coral-bright)", flexShrink: 0 }}
                      />
                      <span className="truncate">{t.pair} · {t.model}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Panel>

          {/* Session status */}
          <SessionCard />

          {/* High-impact calendar — today only */}
          <Panel>
            <PanelHead
              title="High-impact today"
              icon="event"
              action={
                <Link href="/calendar" className="text-[12px] font-medium" style={{ color: "var(--teal)" }}>
                  Calendar →
                </Link>
              }
            />
            {eventsLoading ? (
              <div className="space-y-2.5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 rounded animate-pulse" style={{ background: "var(--track)" }} />
                ))}
              </div>
            ) : todayEvents.length === 0 ? (
              <div className="py-4 text-center text-[12.5px]" style={{ color: "var(--ink-dim)" }}>
                No high-impact events scheduled today.
              </div>
            ) : (
              <div className="flex flex-col">
                {todayEvents.map((ev, i) => (
                  <div
                    key={ev.id}
                    className="flex items-center gap-2.5 py-2.5"
                    style={{ borderBottom: i < todayEvents.length - 1 ? "1px solid var(--line)" : "none" }}
                  >
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ background: IMPACT_COLOR[ev.impact] ?? "var(--ink-dim)" }}
                    />
                    <span className="text-[11px] shrink-0 tabular-nums" style={{ color: "var(--ink-dim)", width: 36 }}>
                      {ev.time}
                    </span>
                    <Chip tone="neutral" style={{ fontSize: 10, padding: "2px 7px" }}>{ev.currency}</Chip>
                    <span className="text-[12.5px] min-w-0 truncate" style={{ color: "var(--ink)" }}>
                      {ev.event}
                    </span>
                    {ev.actual && (
                      <span className="text-[11px] font-semibold shrink-0 ml-auto" style={{ color: "var(--teal)" }}>
                        {ev.actual}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Trend snapshot — live from TrendMatrix localStorage */}
          <Panel>
            <PanelHead
              title="Trend snapshot"
              icon="ssid_chart"
              action={
                <Link href="/trend" className="text-[12px] font-medium" style={{ color: "var(--teal)" }}>
                  Matrix →
                </Link>
              }
            />
            {trendUpdatedAt && (
              <div className="text-[10.5px] mb-2" style={{ color: "var(--ink-dim)" }}>
                Updated {new Date(trendUpdatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            )}
            {/* TF header labels */}
            <div className="flex items-center gap-1.5 mb-2" style={{ paddingLeft: "clamp(48px, 17%, 68px)" }}>
              {(["MN", "W", "D", "H4", "H1"] as const).map((tf) => (
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
              {trendRows.map(({ pair, tfs, bias }) => (
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
                            d === "bullish" ? "rgba(8,174,170,0.25)" :
                            d === "bearish" ? "rgba(234,82,61,0.25)" :
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
