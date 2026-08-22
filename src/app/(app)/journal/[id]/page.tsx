"use client";

import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type { Trade, AIReviewResult } from "@/lib/store";
import { useTrades, useDeleteTrade, useUpdateTrade } from "@/lib/hooks/useTrades";
import { Button, DirPill, Chip, Stars, Icon } from "@/components/ui";
import { LevelChart } from "@/components/charts/LevelChart";
import { AIReview } from "@/components/AIReview";
import { MODEL_BRIEF, FIB_TAG_OPTIONS } from "@/lib/frameworks";
import { cn } from "@/lib/cn";

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
function pnlTextCls(t: Trade) {
  if (t.result === "open") return "text-gold-deep";
  return t.pnlR > 0 ? "text-teal-deep" : "text-coral-deep";
}
function resultBgCls(t: Trade) {
  if (t.result === "open") return "bg-gold-tint";
  return t.pnlR > 0 ? "bg-teal-tint" : "bg-coral-tint";
}

function MetaBox({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl px-4 py-3.5 bg-panel-2 shadow-sm">
      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-dim">
        {label}
      </span>
      <span
        className={`text-ink-strong ${mono ? "tabular-nums text-[15px] font-semibold" : "font-display font-bold text-[20px] tracking-[-0.01em]"}`}
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
      <Icon name="search_off" size={48} className="text-ink-dim" />
      <p className="text-[14px] text-ink-dim">Trade not found.</p>
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
            className="flex items-center gap-1.5 text-[13px] font-semibold transition-opacity hover:opacity-70 text-ink-dim"
          >
            <Icon name="arrow_back" size={16} />
            Journal
          </button>

          {/* Prev / next */}
          <div className="flex items-center rounded-lg overflow-hidden shadow-sm">
            <button
              type="button"
              disabled={!olderTrade}
              onClick={() => olderTrade && router.push(`/journal/${olderTrade.id}`)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors hover:bg-hover disabled:opacity-30 text-ink-dim"
              title={olderTrade ? `${olderTrade.pair} ${olderTrade.date}` : undefined}
            >
              <Icon name="chevron_left" size={15} />
              Older
            </button>
            <button
              type="button"
              disabled={!newerTrade}
              onClick={() => newerTrade && router.push(`/journal/${newerTrade.id}`)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors hover:bg-hover disabled:opacity-30 text-ink-dim"
              title={newerTrade ? `${newerTrade.pair} ${newerTrade.date}` : undefined}
            >
              Newer
              <Icon name="chevron_right" size={15} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" icon="edit" onClick={() => router.push(`/journal/${t.id}/edit`)}>
            Edit
          </Button>
          <Button
            type="button"
            variant="ghost"
            icon="delete"
            onClick={handleDelete}
            className="!text-coral-deep"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* ── Hero header ── */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display font-medium text-[32px] tracking-[-0.025em] text-ink-strong">
              {t.pair}
            </h1>
            <DirPill dir={t.dir} />
            {t.framework === "SnD" && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gold-tint text-gold-deep shadow-ring-gold-2">
                S&D
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[13px] text-ink-dim">
            <span>{t.openedAt ? fmtDateTime(t.openedAt) : t.date}</span>
            {t.session && <><span>·</span><span>{t.session} KZ</span></>}
            {duration && <><span>·</span><Icon name="schedule" size={13} /><span>{duration}</span></>}
            {t.fromAlert && (
              <>
                <span>·</span>
                <Icon name="notifications_active" size={13} fill className="text-gold-deep" />
                <span className="text-gold-deep">From alert</span>
              </>
            )}
          </div>
        </div>

        {/* PnL badge */}
        <div className="flex gap-3 items-start">
          {pipMove && (
            <div className="flex flex-col items-end rounded-2xl px-4 py-3.5 shrink-0 bg-panel-2 shadow-sm">
              <span
                className={`font-bold tabular-nums text-[20px] ${t.result === "win" ? "text-teal-deep" : "text-coral-deep"}`}
              >
                {pipMove}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider mt-0.5 text-ink-dim">
                price move
              </span>
            </div>
          )}
          <div className={cn("flex flex-col items-end rounded-2xl px-5 py-3.5 shrink-0", resultBgCls(t))}>
            <span className={cn("font-display font-bold tabular-nums text-[30px] tracking-[-0.025em]", pnlTextCls(t))}>
              {pnlLabel(t)}
            </span>
            <span className={cn("text-[11px] font-semibold uppercase tracking-wider mt-0.5 opacity-75", pnlTextCls(t))}>
              {t.result}
            </span>
          </div>
        </div>
      </div>

      {/* ── Chart ── */}
      {/* The no-screenshot branch used to render a seeded random walk with the
          FVG zone fixed at candles 22–26 and the entry at candle 27, regardless
          of this trade. Real candles arrive with Spotware trendbars, see
          charts_plan.md. Until then a trade either shows the trader's own
          screenshot or says plainly that it has none. */}
      {t.chartUrl ? (
        <div className="rounded-2xl overflow-hidden mb-6 h-[380px] shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={t.chartUrl} alt="Trade chart" className="w-full h-full object-cover" />
        </div>
      ) : t.openedAt ? (
        <div className="rounded-2xl overflow-hidden mb-6 p-3 bg-panel shadow-sm">
          {/* `date` is a display string ("Jun 12"); openedAt is the real
              timestamp, and without it there is no window to fetch. */}
          <LevelChart
            pair={t.pair}
            direction={t.dir}
            at={new Date(t.openedAt)}
            until={t.closedAt ? new Date(t.closedAt) : null}
            entry={t.entryPrice ?? null}
            stop={t.stopLoss ?? null}
            targets={t.takeProfit != null ? [{ price: t.takeProfit, label: "TP" }] : []}
            height={340}
          />
        </div>
      ) : (
        <div className="rounded-2xl mb-6 py-10 flex flex-col items-center gap-2 text-center bg-panel-2">
          <Icon name="show_chart" size={26} className="text-ink-dim" />
          <div className="text-[13px] font-semibold text-ink-mid">No chart for this trade</div>
          <p className="text-[12px] max-w-xs text-ink-dim">
            This entry has no recorded entry time, so there is no window of price action to draw.
          </p>
        </div>
      )}

      {/* ── Two-column body ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-5">

        {/* ── Left: trade details ── */}
        <div className="flex flex-col gap-4">

          {/* Model */}
          <div className="rounded-xl px-4 py-4 flex items-start gap-3 bg-panel shadow-sm">
            <Icon name="schema" size={20} className="shrink-0 mt-0.5 text-teal-deep" />
            <div>
              <div className="font-semibold text-[14px] mb-0.5 text-ink-strong">
                {t.model}
              </div>
              <div className="text-[13px] leading-relaxed text-ink-dim">
                {brief}
              </div>
            </div>
          </div>

          {/* Price levels */}
          {hasPrices && (
            <div className="rounded-xl px-4 py-4 bg-panel shadow-sm">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-3 text-ink-dim">
                Price levels
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {t.entryPrice != null && (
                  <div>
                    <div className="text-[11px] mb-0.5 text-ink-dim">Entry</div>
                    <div className="font-semibold text-[15px] text-ink-strong">
                      {fmtPrice(t.entryPrice, t.pair)}
                    </div>
                  </div>
                )}
                {t.stopLoss != null && (
                  <div>
                    <div className="text-[11px] mb-0.5 text-ink-dim">Stop loss</div>
                    <div className="font-semibold text-[15px] text-coral-deep">
                      {fmtPrice(t.stopLoss, t.pair)}
                    </div>
                  </div>
                )}
                {t.takeProfit != null && (
                  <div>
                    <div className="text-[11px] mb-0.5 text-ink-dim">Take profit</div>
                    <div className="font-semibold text-[15px] text-teal-deep">
                      {fmtPrice(t.takeProfit, t.pair)}
                    </div>
                  </div>
                )}
                {isClosed && t.closePrice != null && (
                  <div>
                    <div className="text-[11px] mb-0.5 text-ink-dim">Closed at</div>
                    <div
                      className={`font-semibold text-[15px] ${t.result === "win" ? "text-teal-deep" : "text-coral-deep"}`}
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
            <div className="rounded-xl px-4 py-4 bg-panel shadow-sm">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-3 text-ink-dim">
                Timing
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {t.openedAt && (
                  <div>
                    <div className="text-[11px] mb-0.5 text-ink-dim">Opened</div>
                    <div className="text-[13px] font-semibold text-ink-strong">
                      {fmtDateTime(t.openedAt)}
                    </div>
                  </div>
                )}
                {t.closedAt && (
                  <div>
                    <div className="text-[11px] mb-0.5 text-ink-dim">Closed</div>
                    <div className="text-[13px] font-semibold text-ink-strong">
                      {fmtDateTime(t.closedAt)}
                    </div>
                  </div>
                )}
                {duration && (
                  <div>
                    <div className="text-[11px] mb-0.5 text-ink-dim">Duration</div>
                    <div className="text-[13px] font-semibold text-ink-strong">
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
          <div className="rounded-xl px-4 py-4 flex items-center justify-between gap-4 bg-panel shadow-sm">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-2 text-ink-dim">
                Execution quality
              </div>
              <Stars value={t.rating ?? 0} size={20} />
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-dim">
                Rules followed
              </div>
              <div className="flex items-center gap-1.5">
                <Icon
                  name={t.discipline ? "check_circle" : "cancel"}
                  size={20}
                  className={t.discipline ? "text-teal-deep" : "text-coral-deep"}
                />
                <span className={`text-[13px] font-semibold ${t.discipline ? "text-teal-deep" : "text-coral-deep"}`}>
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
              <div className="rounded-xl px-4 py-4 bg-panel shadow-sm">
                <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-2.5 text-ink-dim">
                  Tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {otherTags.map((tag) => <Chip key={tag} tone="teal">{tag}</Chip>)}
                  {fibTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold bg-gold-tint shadow-ring-gold-2 text-gold-deep"
                    >
                      <Icon name="architecture" size={11} />
                      {tag}
                    </span>
                  ))}
                </div>
                {fibTags.length > 0 && (
                  <div className="text-[11px] mt-1.5 text-ink-dim">
                    Fibonacci confluence at {fibTags.join(", ")}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Notes */}
          {t.note && (
            <div className="rounded-xl px-4 py-4 bg-panel shadow-sm">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-2 text-ink-dim">
                Notes
              </div>
              <p className="text-[13.5px] leading-relaxed text-ink-mid">
                {t.note}
              </p>
            </div>
          )}

          {/* Discipline breach — merged with mistake if both present */}
          {!t.discipline && (
            <div className="flex items-start gap-3 rounded-xl px-4 py-4 bg-coral-tint-soft shadow-ring-coral-2">
              <Icon name="warning" size={18} fill className="text-coral-deep shrink-0 mt-px" />
              <div>
                <div className="font-semibold text-[13px] mb-1 text-coral-deep">
                  {t.mistake ? "Rule broken" : "Discipline breach recorded"}
                </div>
                <div className="text-[12.5px] leading-relaxed text-ink-mid">
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
    </div>
  );
}
