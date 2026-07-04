"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type { Trade, AIReviewResult } from "@/lib/store";
import { useTrades, useDeleteTrade, useUpdateTrade } from "@/lib/hooks/useTrades";
import { Button, DirPill, Chip, Stars, Icon, CandleChart } from "@/components/ui";
import type { Candle, Zone, PriceLine, Mark } from "@/components/ui";
import { AIReview } from "@/components/AIReview";
import { LogTradeModal } from "../LogTradeModal";
import { MODEL_BRIEF, FIB_TAG_OPTIONS } from "@/lib/frameworks";

// ── Seeded chart generation ───────────────────────────────────────────────────

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6d2b79f5 | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function strHash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function genCandles(seed: number, n: number, start: number, vol: number, drift: number): Candle[] {
  const rng = mulberry32(seed);
  const out: Candle[] = [];
  let price = start;
  for (let i = 0; i < n; i++) {
    const d = (rng() - 0.5 + drift * 0.1) * vol;
    const o = price, c = price + d;
    const h = Math.max(o, c) + rng() * vol * 0.4;
    const l = Math.min(o, c) - rng() * vol * 0.4;
    out.push({ o, h, l, c });
    price = c;
  }
  return out;
}
const PAIR_START: Record<string, number> = { EURUSD: 1.085, GBPUSD: 1.27, NZDUSD: 0.608, XAUUSD: 2328, NAS100: 19800 };
const PAIR_VOL:   Record<string, number> = { EURUSD: 0.0008, GBPUSD: 0.001, NZDUSD: 0.0007, XAUUSD: 4, NAS100: 60 };

// ── Price formatting helpers ──────────────────────────────────────────────────

function priceDecimals(pair: string): number {
  if (pair === "XAUUSD") return 2;
  if (pair === "NAS100") return 1;
  return 5;
}

function fmtPrice(val: number, pair: string) {
  return val.toFixed(priceDecimals(pair));
}

function calcPipMove(entry: number, close: number, dir: "long" | "short", pair: string): string {
  const move = dir === "long" ? close - entry : entry - close;
  if (pair === "XAUUSD" || pair === "NAS100") {
    const pts = move.toFixed(pair === "NAS100" ? 1 : 2);
    return `${move >= 0 ? "+" : ""}${pts} pts`;
  }
  const pips = (move * 10000).toFixed(1);
  return `${move >= 0 ? "+" : ""}${pips} pips`;
}

function fmtDuration(a: string, b: string): string {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  if (ms < 0) return "—";
  const totalMins = Math.floor(ms / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m}m`;
  if (h < 24) return `${h}h ${m}m`;
  const days = Math.floor(h / 24);
  const remH  = h % 24;
  return remH > 0 ? `${days}d ${remH}h` : `${days}d`;
}

import { fmtDateTime as _fmtDateTime } from "@/lib/date";
function fmtDateTime(iso: string): string { return _fmtDateTime(iso); }

// ── Helpers ───────────────────────────────────────────────────────────────────

function pnlLabel(t: Trade) {
  if (t.result === "open") return "Open";
  return t.pnlR > 0 ? `+${t.pnlR.toFixed(1)}R` : `${t.pnlR.toFixed(1)}R`;
}
function pnlColor(t: Trade) {
  if (t.result === "open") return "var(--gold)";
  return t.pnlR > 0 ? "var(--teal-bright)" : "var(--coral-bright)";
}
function resultBg(t: Trade) {
  if (t.result === "open") return "rgba(248,185,61,0.14)";
  return t.pnlR > 0 ? "rgba(8,174,170,0.14)" : "rgba(234,82,61,0.14)";
}

function MetaBox({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      className="flex flex-col gap-0.5 rounded-xl px-4 py-3.5"
      style={{ background: "var(--panel-2)", border: "1px solid var(--line)" }}
    >
      <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-dim)" }}>
        {label}
      </span>
      <span
        className={mono ? "font-mono tabular-nums text-[15px] font-semibold" : "font-display font-bold text-[20px]"}
        style={{ color: "var(--ink-strong)", letterSpacing: mono ? 0 : "-0.01em" }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Not found ─────────────────────────────────────────────────────────────────

function NotFound() {
  const router = useRouter();
  return (
    <div className="view flex flex-col items-center justify-center gap-4 py-24">
      <span className="material-symbols-rounded" style={{ fontSize: 48, color: "var(--ink-dim)" }}>search_off</span>
      <p className="text-[14px]" style={{ color: "var(--ink-dim)" }}>Trade not found.</p>
      <Button type="button" variant="ghost" icon="arrow_back" onClick={() => router.push("/journal")}>
        Back to journal
      </Button>
    </div>
  );
}

// ── Trade detail page ─────────────────────────────────────────────────────────

export default function TradeDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { toast } = useStore();
  const { trades } = useTrades();
  const { mutate: deleteTrade } = useDeleteTrade();
  const { mutate: updateTrade } = useUpdateTrade();

  const trade = trades.find((t) => t.id === id) ?? null;
  const [editing, setEditing] = useState(false);

  const { candles, zones, lines, marks } = useMemo(() => {
    if (!trade) return { candles: [], zones: [], lines: [], marks: [] };
    const seed  = strHash(trade.id);
    const start = PAIR_START[trade.pair] ?? 1.1;
    const vol   = PAIR_VOL[trade.pair]   ?? 0.001;
    const drift = trade.dir === "long" ? 1 : -1;
    const cs    = genCandles(seed, 60, start, vol, drift);
    const fvgLo = Math.min(cs[22].l, cs[23].l, cs[24].l);
    const fvgHi = Math.max(cs[22].h, cs[23].h, cs[24].h);
    const zones_: Zone[]      = [{ i0: 22, i1: 26, lo: fvgLo, hi: fvgHi, type: "fvg", dir: trade.dir }];
    const lines_: PriceLine[] = [{ price: cs[27].o, color: trade.dir === "long" ? "var(--teal)" : "var(--coral)", label: "Entry" }];
    const mt = trade.model.includes("CHoCH") ? "choch" : "bos";
    const marks_: Mark[]      = [{ i: 42, price: cs[42].h, label: mt.toUpperCase(), type: mt }];
    return { candles: cs, zones: zones_, lines: lines_, marks: marks_ };
  }, [trade]);

  function handleDelete() {
    if (!trade) return;
    deleteTrade(trade.id);
    toast("Trade removed", "coral", "delete");
    router.push("/journal");
  }

  function handleSaveReview(result: AIReviewResult) {
    if (!trade) return;
    updateTrade({ id: trade.id, patch: { aiReview: result } });
  }

  if (!trade) return <NotFound />;

  const tradeIndex = trades.findIndex((t) => t.id === id);
  const olderTrade = tradeIndex < trades.length - 1 ? trades[tradeIndex + 1] : null;
  const newerTrade = tradeIndex > 0                  ? trades[tradeIndex - 1] : null;

  const t = trade;
  const brief     = MODEL_BRIEF[t.framework === "SnD" ? "SnD" : "SMC"]?.[t.model] ?? "Confluence setup.";
  const isClosed  = t.result !== "open";
  const hasPrices = t.entryPrice != null || t.stopLoss != null || t.takeProfit != null;
  const hasTiming = t.openedAt != null;
  const pipMove   = isClosed && t.entryPrice != null && t.closePrice != null
    ? calcPipMove(t.entryPrice, t.closePrice, t.dir, t.pair)
    : null;
  const duration  = isClosed && t.openedAt && t.closedAt
    ? fmtDuration(t.openedAt, t.closedAt)
    : null;

  return (
    <div className="view">

      {/* ── Nav bar ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/journal")}
            className="flex items-center gap-1.5 text-[13px] font-semibold transition-opacity hover:opacity-70"
            style={{ color: "var(--ink-dim)" }}
          >
            <Icon name="arrow_back" size={16} />
            Journal
          </button>

          {/* Prev / next */}
          <div
            className="flex items-center rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--line)" }}
          >
            <button
              type="button"
              disabled={!olderTrade}
              onClick={() => olderTrade && router.push(`/journal/${olderTrade.id}`)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors hover:bg-[var(--hover)] disabled:opacity-30"
              style={{ color: "var(--ink-dim)", borderRight: "1px solid var(--line)" }}
              title={olderTrade ? `${olderTrade.pair} ${olderTrade.date}` : undefined}
            >
              <Icon name="chevron_left" size={15} />
              Older
            </button>
            <button
              type="button"
              disabled={!newerTrade}
              onClick={() => newerTrade && router.push(`/journal/${newerTrade.id}`)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors hover:bg-[var(--hover)] disabled:opacity-30"
              style={{ color: "var(--ink-dim)" }}
              title={newerTrade ? `${newerTrade.pair} ${newerTrade.date}` : undefined}
            >
              Newer
              <Icon name="chevron_right" size={15} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" icon="edit" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button
            type="button"
            variant="ghost"
            icon="delete"
            onClick={handleDelete}
            style={{ color: "var(--coral)" }}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* ── Hero header ── */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1
              className="font-display font-bold"
              style={{ fontSize: 32, letterSpacing: "-0.025em", color: "var(--ink-strong)" }}
            >
              {t.pair}
            </h1>
            <DirPill dir={t.dir} />
            {t.framework === "SnD" && (
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                style={{ background: "rgba(248,185,61,0.12)", color: "var(--gold)", border: "1px solid rgba(248,185,61,0.25)" }}
              >
                S&D
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--ink-dim)" }}>
            <span>{t.openedAt ? fmtDateTime(t.openedAt) : t.date}</span>
            {t.session && <><span>·</span><span>{t.session} KZ</span></>}
            {duration && <><span>·</span><Icon name="schedule" size={13} /><span>{duration}</span></>}
            {t.fromAlert && (
              <>
                <span>·</span>
                <Icon name="notifications_active" size={13} fill style={{ color: "var(--gold)" }} />
                <span style={{ color: "var(--gold)" }}>From alert</span>
              </>
            )}
          </div>
        </div>

        {/* PnL badge */}
        <div className="flex gap-3 items-start">
          {pipMove && (
            <div
              className="flex flex-col items-end rounded-2xl px-4 py-3.5 shrink-0"
              style={{ background: "var(--panel-2)", border: "1px solid var(--line)" }}
            >
              <span
                className="font-mono font-bold tabular-nums text-[20px]"
                style={{ color: t.result === "win" ? "var(--teal-bright)" : "var(--coral-bright)" }}
              >
                {pipMove}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "var(--ink-dim)" }}>
                price move
              </span>
            </div>
          )}
          <div
            className="flex flex-col items-end rounded-2xl px-5 py-3.5 shrink-0"
            style={{ background: resultBg(t) }}
          >
            <span
              className="font-display font-bold tabular-nums"
              style={{ fontSize: 30, letterSpacing: "-0.025em", color: pnlColor(t) }}
            >
              {pnlLabel(t)}
            </span>
            <span
              className="text-[11px] font-semibold uppercase tracking-wider mt-0.5"
              style={{ color: pnlColor(t), opacity: 0.75 }}
            >
              {t.result}
            </span>
          </div>
        </div>
      </div>

      {/* ── Chart ── */}
      <div
        className="rounded-2xl overflow-hidden mb-6"
        style={{ height: 380, border: "1px solid var(--line)" }}
      >
        {t.chartUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.chartUrl} alt="Trade chart" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <CandleChart candles={candles} annotations={{ zones, lines, marks }} height={300} />
        )}
      </div>

      {/* ── Two-column body ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-5">

        {/* ── Left: trade details ── */}
        <div className="flex flex-col gap-4">

          {/* Model */}
          <div
            className="rounded-xl px-4 py-4 flex items-start gap-3"
            style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
          >
            <span className="material-symbols-rounded shrink-0 mt-0.5" style={{ fontSize: 20, color: "var(--teal)" }}>
              schema
            </span>
            <div>
              <div className="font-semibold text-[14px] mb-0.5" style={{ color: "var(--ink-strong)" }}>
                {t.model}
              </div>
              <div className="text-[13px] leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                {brief}
              </div>
            </div>
          </div>

          {/* Price levels */}
          {hasPrices && (
            <div
              className="rounded-xl px-4 py-4"
              style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
            >
              <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--ink-dim)" }}>
                Price levels
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {t.entryPrice != null && (
                  <div>
                    <div className="text-[11px] mb-0.5" style={{ color: "var(--ink-dim)" }}>Entry</div>
                    <div className="font-mono font-semibold text-[15px]" style={{ color: "var(--ink-strong)" }}>
                      {fmtPrice(t.entryPrice, t.pair)}
                    </div>
                  </div>
                )}
                {t.stopLoss != null && (
                  <div>
                    <div className="text-[11px] mb-0.5" style={{ color: "var(--ink-dim)" }}>Stop loss</div>
                    <div className="font-mono font-semibold text-[15px]" style={{ color: "var(--coral)" }}>
                      {fmtPrice(t.stopLoss, t.pair)}
                    </div>
                  </div>
                )}
                {t.takeProfit != null && (
                  <div>
                    <div className="text-[11px] mb-0.5" style={{ color: "var(--ink-dim)" }}>Take profit</div>
                    <div className="font-mono font-semibold text-[15px]" style={{ color: "var(--teal)" }}>
                      {fmtPrice(t.takeProfit, t.pair)}
                    </div>
                  </div>
                )}
                {isClosed && t.closePrice != null && (
                  <div>
                    <div className="text-[11px] mb-0.5" style={{ color: "var(--ink-dim)" }}>Closed at</div>
                    <div
                      className="font-mono font-semibold text-[15px]"
                      style={{ color: t.result === "win" ? "var(--teal-bright)" : "var(--coral-bright)" }}
                    >
                      {fmtPrice(t.closePrice, t.pair)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timing */}
          {hasTiming && (
            <div
              className="rounded-xl px-4 py-4"
              style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
            >
              <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--ink-dim)" }}>
                Timing
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {t.openedAt && (
                  <div>
                    <div className="text-[11px] mb-0.5" style={{ color: "var(--ink-dim)" }}>Opened</div>
                    <div className="font-mono text-[13px] font-semibold" style={{ color: "var(--ink-strong)" }}>
                      {fmtDateTime(t.openedAt)}
                    </div>
                  </div>
                )}
                {t.closedAt && (
                  <div>
                    <div className="text-[11px] mb-0.5" style={{ color: "var(--ink-dim)" }}>Closed</div>
                    <div className="font-mono text-[13px] font-semibold" style={{ color: "var(--ink-strong)" }}>
                      {fmtDateTime(t.closedAt)}
                    </div>
                  </div>
                )}
                {duration && (
                  <div>
                    <div className="text-[11px] mb-0.5" style={{ color: "var(--ink-dim)" }}>Duration</div>
                    <div className="font-mono text-[13px] font-semibold" style={{ color: "var(--ink-strong)" }}>
                      {duration}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetaBox label="Planned R:R" value={t.rr ? `1:${t.rr}` : "—"} />
            <MetaBox label="Risk"         value={t.riskPct ? `${t.riskPct}%` : "—"} />
            <MetaBox label="Session"      value={t.session ?? "—"} />
          </div>

          {/* Execution + Discipline */}
          <div
            className="rounded-xl px-4 py-4 flex items-center justify-between gap-4"
            style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
          >
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--ink-dim)" }}>
                Execution quality
              </div>
              <Stars value={t.rating ?? 0} size={20} />
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-dim)" }}>
                Rules followed
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="material-symbols-rounded"
                  style={{ fontSize: 20, color: t.discipline ? "var(--teal)" : "var(--coral)", fontVariationSettings: "'FILL' 1" }}
                >
                  {t.discipline ? "check_circle" : "cancel"}
                </span>
                <span className="text-[13px] font-semibold" style={{ color: t.discipline ? "var(--teal)" : "var(--coral)" }}>
                  {t.discipline ? "Clean" : "Broken"}
                </span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {t.tags.length > 0 && (() => {
            const fibTagSet = new Set(FIB_TAG_OPTIONS as readonly string[]);
            const fibTags   = t.tags.filter((tag) => fibTagSet.has(tag));
            const otherTags = t.tags.filter((tag) => !fibTagSet.has(tag));
            return (
              <div
                className="rounded-xl px-4 py-4"
                style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
              >
                <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: "var(--ink-dim)" }}>
                  Tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {otherTags.map((tag) => <Chip key={tag} tone="teal">{tag}</Chip>)}
                  {fibTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold"
                      style={{
                        background: "rgba(248,185,61,0.13)",
                        border: "1px solid rgba(248,185,61,0.3)",
                        color: "var(--gold)",
                      }}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 11, fontVariationSettings: "'FILL' 1" }}>architecture</span>
                      {tag}
                    </span>
                  ))}
                </div>
                {fibTags.length > 0 && (
                  <div className="text-[11px] mt-1.5" style={{ color: "var(--ink-dim)" }}>
                    Fibonacci confluence at {fibTags.join(", ")}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Notes */}
          {t.note && (
            <div
              className="rounded-xl px-4 py-4"
              style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
            >
              <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--ink-dim)" }}>
                Notes
              </div>
              <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--ink-mid)" }}>
                {t.note}
              </p>
            </div>
          )}

          {/* Discipline breach — merged with mistake if both present */}
          {!t.discipline && (
            <div
              className="flex items-start gap-3 rounded-xl px-4 py-4"
              style={{ background: "rgba(234,82,61,0.07)", border: "1px solid rgba(234,82,61,0.22)" }}
            >
              <Icon name="warning" size={18} fill style={{ color: "var(--coral)", flexShrink: 0, marginTop: 1 }} />
              <div>
                <div className="font-semibold text-[13px] mb-1" style={{ color: "var(--coral)" }}>
                  {t.mistake ? "Rule broken" : "Discipline breach recorded"}
                </div>
                <div className="text-[12.5px] leading-relaxed" style={{ color: "var(--ink-mid)" }}>
                  {t.mistake ?? "This trade broke your rules. Review your mistake log to find patterns. Recurring breaches are usually the same emotional trigger."}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Gavo AI Review ── */}
        <div>
          <AIReview
            trade={t}
            initialReview={t.aiReview ?? undefined}
            onSave={handleSaveReview}
          />
        </div>
      </div>

      {/* ── Edit modal ── */}
      <LogTradeModal
        open={editing}
        onClose={() => setEditing(false)}
        edit={t}
      />
    </div>
  );
}
