"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type { Trade } from "@/lib/store";
import { useTrades, useDeleteTrade } from "@/lib/hooks/useTrades";
import {
  Button, DirPill, Chip, StatTile, Stars, Icon, EmptyState, Panel, Sparkline,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { LogTradeModal } from "./LogTradeModal";
import { useInstrumentSymbols } from "@/lib/hooks/useInstruments";

// ── Constants ──────────────────────────────────────────────────────────────────

const FILTERS = ["All", "Wins", "Losses", "Open"] as const;
type Filter   = typeof FILTERS[number];

const SESSION_BG_CLS: Record<string, string> = {
  London:     "bg-teal",
  "New York": "bg-coral",
  Asia:       "bg-gold",
};
const SESSION_TEXT_CLS: Record<string, string> = {
  London:     "text-teal",
  "New York": "text-coral",
  Asia:       "text-gold",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function pnlLabel(t: Trade) {
  if (t.result === "open") return "Open";
  if (t.pnlR > 0)  return `+${t.pnlR.toFixed(1)}R`;
  return `${t.pnlR.toFixed(1)}R`;
}
function pnlCls(t: Trade): { textCls: string; bgCls: string; shadowCls: string } {
  if (t.result === "open") return { textCls: "text-gold", bgCls: "bg-gold", shadowCls: "shadow-[0_0_4px_var(--gold)]" };
  return t.pnlR >= 0
    ? { textCls: "text-teal-bright", bgCls: "bg-teal-bright", shadowCls: "shadow-[0_0_4px_var(--teal-bright)]" }
    : { textCls: "text-coral-bright", bgCls: "bg-coral-bright", shadowCls: "shadow-[0_0_4px_var(--coral-bright)]" };
}

function currentStreak(trades: Trade[]) {
  if (!trades.length) return { n: 0, type: "none" as const };
  const closed = trades.filter((t) => t.result !== "open");
  if (!closed.length) return { n: 0, type: "none" as const };
  const last = closed[0].result;
  let n = 0;
  for (const t of closed) {
    if (t.result !== last) break;
    n++;
  }
  return { n, type: last as "win" | "loss" };
}

function fmtAvgHold(ms: number): string {
  const mins = Math.round(ms / 60000);
  const h    = Math.floor(mins / 60);
  if (h === 0)  return `${mins}m`;
  if (h < 24)   return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ModelBar({ model, pct, n }: { model: string; pct: number; n: number }) {
  const shortName = model.split("→")[0].split("+")[0].trim();
  return (
    <div className="flex items-center gap-2.5">
      <div className="text-[11.5px] font-medium min-w-0 flex-1 truncate text-ink-mid">
        {shortName}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="relative h-1.5 rounded-full overflow-hidden w-20 bg-track">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${pct >= 60 ? "bg-teal" : pct >= 40 ? "bg-gold" : "bg-coral"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[11px] font-semibold tabular-nums text-ink-dim w-8 text-right">
          {pct}%
        </span>
        <span className="text-[10px] text-ink-dim w-5">
          /{n}
        </span>
      </div>
    </div>
  );
}

function PairBar({ pair, pct, n }: { pair: string; pct: number; n: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[11px] font-bold tabular-nums shrink-0 text-ink-mid w-14">
        {pair}
      </span>
      <div className="flex-1 relative h-1.5 rounded-full overflow-hidden bg-track">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${pct >= 60 ? "bg-teal" : pct >= 40 ? "bg-gold" : "bg-coral"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-semibold tabular-nums shrink-0 text-ink-dim w-8 text-right">
        {pct}%
      </span>
      <span className="text-[10px] shrink-0 text-ink-dim w-5">
        /{n}
      </span>
    </div>
  );
}

function SessionBar({ session, count, max }: { session: string; count: number; max: number }) {
  const pct = max ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[11.5px] font-medium text-ink-mid w-[72px]">{session}</span>
      <div className="flex-1 relative h-1.5 rounded-full overflow-hidden bg-track">
        <div
          className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-700", SESSION_BG_CLS[session] ?? "bg-teal")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] tabular-nums font-semibold text-ink-dim w-4 text-right">
        {count}
      </span>
    </div>
  );
}

// ── Analytics panel ────────────────────────────────────────────────────────────

function AnalyticsPanel({ trades }: { trades: Trade[] }) {
  const { stats } = useTrades();
  const sparkRef  = useRef<HTMLDivElement>(null);

  const sessionCounts = useMemo(() => {
    const counts: Record<string, number> = { London: 0, "New York": 0, Asia: 0 };
    trades.forEach((t) => { if (t.session && t.session in counts) counts[t.session]++; });
    return counts;
  }, [trades]);
  const sessionMax = Math.max(...Object.values(sessionCounts), 1);

  const pairStats = useMemo(() => {
    const map: Record<string, { wins: number; total: number }> = {};
    trades.filter((t) => t.result !== "open").forEach((t) => {
      if (!map[t.pair]) map[t.pair] = { wins: 0, total: 0 };
      map[t.pair].total++;
      if (t.result === "win") map[t.pair].wins++;
    });
    return Object.entries(map)
      .map(([pair, { wins, total }]) => ({
        pair,
        pct: Math.round((wins / total) * 100),
        n: total,
      }))
      .sort((a, b) => b.n - a.n);
  }, [trades]);

  const avgHoldMs = useMemo(() => {
    const timed = trades.filter((t) => t.openedAt && t.closedAt);
    if (!timed.length) return null;
    const total = timed.reduce(
      (s, t) => s + (new Date(t.closedAt!).getTime() - new Date(t.openedAt!).getTime()),
      0,
    );
    return total / timed.length;
  }, [trades]);

  const leaks = useMemo(() => {
    const byModel: Record<string, number> = {};
    trades.filter((t) => !t.discipline).forEach((t) => {
      byModel[t.model] = (byModel[t.model] ?? 0) + 1;
    });
    return Object.entries(byModel)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([model, count]) => ({ model: model.split("→")[0].split("+")[0].trim(), count }));
  }, [trades]);

  const equityColor = (stats.netR ?? 0) >= 0 ? "var(--teal-bright)" : "var(--coral-bright)";
  const equityColorCls = (stats.netR ?? 0) >= 0 ? "text-teal-bright" : "text-coral-bright";

  return (
    <div className="flex flex-col gap-4">

      {/* Equity curve */}
      {stats.equity.length > 1 && (
        <Panel>
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-display font-semibold text-[14px] text-ink-strong">
                Equity curve
              </span>
              <span className={`font-display font-bold tabular-nums text-[18px] tracking-[-0.01em] ${equityColorCls}`}>
                {stats.netR >= 0 ? "+" : ""}{stats.netR.toFixed(1)}R
              </span>
            </div>
            <p className="text-[11px] mb-3 text-ink-dim">
              Cumulative R · {stats.closed} closed trades
            </p>
            <div ref={sparkRef} className="w-full h-20">
              <Sparkline
                data={stats.equity}
                width={260}
                height={80}
                color={equityColor}
                strokeW={2}
                fill
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[9.5px] tabular-nums text-ink-dim">
                {Math.min(...stats.equity).toFixed(1)}R
              </span>
              <span className="text-[9.5px] tabular-nums text-ink-dim">
                {Math.max(...stats.equity).toFixed(1)}R
              </span>
            </div>
          </div>
        </Panel>
      )}

      {/* Avg win / avg loss / hold time */}
      <Panel>
        <div className={`px-4 pt-4 pb-4 grid gap-3 ${avgHoldMs != null ? "grid-cols-3" : "grid-cols-2"}`}>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-1 text-ink-dim">
              Avg win
            </div>
            <div className="font-display font-bold tabular-nums text-[20px] tracking-[-0.01em] text-teal-bright">
              +{stats.avgWin.toFixed(1)}R
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-1 text-ink-dim">
              Avg loss
            </div>
            <div className="font-display font-bold tabular-nums text-[20px] tracking-[-0.01em] text-coral-bright">
              {stats.avgLoss.toFixed(1)}R
            </div>
          </div>
          {avgHoldMs != null && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-1 text-ink-dim">
                Avg hold
              </div>
              <div className="font-display font-bold tabular-nums text-[20px] tracking-[-0.01em] text-ink-strong">
                {fmtAvgHold(avgHoldMs)}
              </div>
            </div>
          )}
        </div>
      </Panel>

      {/* Model win rate */}
      <Panel>
        <div className="px-4 pt-4 pb-3">
          <div className="font-display font-semibold text-[14px] mb-3 text-ink-strong">
            Model win rate
          </div>
          {stats.models.length === 0 ? (
            <p className="text-[12px] pb-2 text-ink-dim">No closed trades yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5 pb-2">
              {stats.models.slice(0, 6).map((m) => (
                <ModelBar key={m.model} model={m.model} pct={m.pct} n={m.n} />
              ))}
            </div>
          )}
        </div>
      </Panel>

      {/* Pair performance */}
      {pairStats.length > 0 && (
        <Panel>
          <div className="px-4 pt-4 pb-3">
            <div className="font-display font-semibold text-[14px] mb-3 text-ink-strong">
              Pair performance
            </div>
            <div className="flex flex-col gap-2.5 pb-2">
              {pairStats.map((p) => (
                <PairBar key={p.pair} pair={p.pair} pct={p.pct} n={p.n} />
              ))}
            </div>
          </div>
        </Panel>
      )}

      {/* Session breakdown */}
      <Panel>
        <div className="px-4 pt-4 pb-4">
          <div className="font-display font-semibold text-[14px] mb-3 text-ink-strong">
            Sessions
          </div>
          <div className="flex flex-col gap-2.5">
            {Object.entries(sessionCounts).map(([session, count]) => (
              <SessionBar key={session} session={session} count={count} max={sessionMax} />
            ))}
          </div>
        </div>
      </Panel>

      {/* Recurring leaks */}
      {leaks.length > 0 && (
        <Panel>
          <div className="px-4 pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="warning" size={15} fill className="text-coral" />
              <span className="font-display font-semibold text-[14px] text-ink-strong">
                Recurring leaks
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {leaks.map(({ model, count }) => (
                <div key={model} className="flex items-center justify-between">
                  <span className="text-[12px] text-ink-mid">{model}</span>
                  <Chip tone="coral">{count}×</Chip>
                </div>
              ))}
            </div>
            <p className="text-[11.5px] leading-relaxed mt-3 text-ink-dim">
              Rule breaks on these setups. Review your checklist before entering.
            </p>
          </div>
        </Panel>
      )}
    </div>
  );
}

// ── Trade table row ────────────────────────────────────────────────────────────

function TradeRow({ trade, onView, onEdit }: { trade: Trade; onView: (id: string) => void; onEdit: () => void }) {
  return (
    <tr
      className="group cursor-pointer transition-colors hover:bg-hover"
      onClick={() => onView(trade.id)}
    >
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span
            className={cn("shrink-0 rounded-full w-1.5 h-1.5", pnlCls(trade).bgCls, trade.result !== "open" && pnlCls(trade).shadowCls)}
          />
          <div className="text-[12.5px] font-medium tabular-nums text-ink-dim">
            {trade.date}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-[13.5px] text-ink-strong">
            {trade.pair}
          </span>
          <DirPill dir={trade.dir} size="sm" />
          {trade.fromAlert && (
            <Icon name="notifications_active" size={13} fill className="text-gold shrink-0" />
          )}
        </div>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <div className="text-[12px] max-w-[160px] truncate text-ink-mid">
          {trade.model.split("→")[0].split("+")[0].trim()}
        </div>
      </td>
      <td className="px-4 py-3 hidden xl:table-cell">
        {trade.session && (
          <span className={cn("text-[11.5px] font-medium", SESSION_TEXT_CLS[trade.session] ?? "text-ink-dim")}>
            {trade.session}
          </span>
        )}
      </td>
      <td className="px-4 py-3 hidden lg:table-cell text-right">
        <span className="tabular-nums text-[12.5px] text-ink-dim">
          {trade.rr ? `1:${trade.rr}` : "—"}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className={cn("font-display font-bold tabular-nums text-[14px] tracking-[-0.01em]", pnlCls(trade).textCls)}>
          {pnlLabel(trade)}
        </span>
      </td>
      <td className="px-4 py-3 hidden xl:table-cell">
        <Stars value={trade.rating ?? 0} size={13} />
      </td>
      <td className="px-4 py-3 hidden lg:table-cell text-center">
        <span
          className={`material-symbols-rounded ic-fill text-[16px] ${trade.discipline ? "text-teal" : "text-coral"}`}
        >
          {trade.discipline ? "check_circle" : "cancel"}
        </span>
      </td>
      <td className="px-4 py-3">
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="p-1 rounded-lg hover:bg-hover transition-colors text-ink-dim"
            onClick={onEdit}
            title="Edit"
          >
            <Icon name="edit" size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-line">
      <span className="text-[12px] text-ink-dim">
        {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="p-1.5 rounded-lg hover:bg-hover disabled:opacity-30 transition-colors text-ink-mid"
        >
          <Icon name="chevron_left" size={18} />
        </button>
        {Array.from({ length: Math.min(pages, 5) }).map((_, i) => {
          const p = i + 1;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={`size-7 rounded-lg text-[12px] font-semibold transition-colors ${page === p ? "bg-teal text-white" : "text-ink-mid"}`}
            >
              {p}
            </button>
          );
        })}
        <button
          type="button"
          disabled={page === pages}
          onClick={() => onChange(page + 1)}
          className="p-1.5 rounded-lg hover:bg-hover disabled:opacity-30 transition-colors text-ink-mid"
        >
          <Icon name="chevron_right" size={18} />
        </button>
      </div>
    </div>
  );
}

// ── Journal ───────────────────────────────────────────────────────────────────

export function Journal() {
  const router = useRouter();
  const { toast } = useStore();
  const { trades, stats } = useTrades();
  const { mutate: deleteTrade } = useDeleteTrade();
  const pairs = useInstrumentSymbols();

  const [filter, setFilter]     = useState<Filter>("All");
  const [pairFilter, setPair]   = useState<string | null>(null);
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);
  const [logOpen, setLogOpen]   = useState(false);
  const [editing, setEditing]   = useState<Trade | null>(null);

  const streak = useMemo(() => currentStreak(trades), [trades]);

  const filtered = useMemo(() => {
    let list = trades;
    if (filter === "Wins")   list = list.filter((t) => t.result === "win");
    if (filter === "Losses") list = list.filter((t) => t.result === "loss");
    if (filter === "Open")   list = list.filter((t) => t.result === "open");
    if (pairFilter)          list = list.filter((t) => t.pair === pairFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.pair.toLowerCase().includes(q) ||
        t.model.toLowerCase().includes(q) ||
        (t.note ?? "").toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return list;
  }, [trades, filter, pairFilter, search]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleFilterChange(f: Filter) { setFilter(f); setPage(1); }
  function handlePairToggle(pair: string) { setPair((p) => (p === pair ? null : pair)); setPage(1); }
  function handleSearch(v: string)        { setSearch(v); setPage(1); }

  const openCount  = trades.filter((t) => t.result === "open").length;
  const netRTone   = stats.netR > 0 ? "up" : stats.netR < 0 ? "down" : "neutral";

  return (
    <div className="view">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display font-bold text-2xl tracking-[-0.02em] text-ink-strong">
              Trade Journal
            </h1>
            {streak.n >= 2 && (
              <span
                className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                  streak.type === "win"
                    ? "bg-[rgba(8,174,170,0.1)] text-teal-bright border border-[rgba(8,174,170,0.28)]"
                    : "bg-[rgba(234,82,61,0.1)] text-coral-bright border border-[rgba(234,82,61,0.28)]"
                }`}
              >
                <Icon
                  name={streak.type === "win" ? "local_fire_department" : "trending_down"}
                  size={12}
                  fill
                  className="text-inherit"
                />
                {streak.n}{streak.type === "win" ? "W" : "L"} streak
              </span>
            )}
          </div>
          <p className="text-[13px] mt-0.5 text-ink-dim">
            {trades.length === 0
              ? "Start logging trades to build your edge."
              : `${trades.length} trade${trades.length !== 1 ? "s" : ""} logged · ${stats.closed} closed`}
          </p>
        </div>
        <Button type="button" variant="primary" icon="add_task" onClick={() => { setEditing(null); setLogOpen(true); }}>
          Log trade
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatTile
          label="Net R"
          value={(stats.netR >= 0 ? "+" : "") + stats.netR.toFixed(1) + "R"}
          sub={`${stats.closed} closed trades`}
          tone={netRTone}
          icon="trending_up"
        />
        <StatTile
          label="Win rate"
          value={`${stats.winRate}%`}
          sub={`${stats.wins}W / ${stats.losses}L`}
          tone={stats.winRate >= 50 ? "up" : "down"}
          icon="percent"
        />
        <StatTile
          label="Expectancy"
          value={(stats.expectancy > 0 ? "+" : "") + stats.expectancy + "R"}
          sub="Expected R per trade"
          tone={stats.expectancy > 0 ? "up" : stats.expectancy < 0 ? "down" : "neutral"}
          icon="functions"
        />
        <div
          className="cursor-pointer select-none"
          onClick={() => handleFilterChange(filter === "Open" ? "All" : "Open")}
          title="Click to filter open positions"
        >
          <StatTile
            label="Open"
            value={String(openCount)}
            sub="Active positions"
            tone="gold"
            icon="radio_button_checked"
          />
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] gap-5">

        {/* ── Left: table ── */}
        <div className="flex flex-col gap-3">
          {/* Filter bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center rounded-xl p-0.5 bg-panel-2 border border-line">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => handleFilterChange(f)}
                  className={`px-3.5 py-1.5 rounded-[10px] text-[12.5px] font-semibold transition-all ${
                    filter === f ? "bg-panel text-ink-strong shadow-[0_1px_4px_rgba(0,0,0,0.12)]" : "text-ink-dim"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Pair chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {pairs.map((pair) => (
                <button
                  key={pair}
                  type="button"
                  onClick={() => handlePairToggle(pair)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    pairFilter === pair ? "bg-teal text-white" : "bg-panel-2 text-ink-dim border border-line"
                  }`}
                >
                  {pair}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl flex-1 min-w-0 bg-panel-2 border border-line">
              <Icon name="search" size={15} className="text-ink-dim shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search pair, model, notes…"
                className="flex-1 bg-transparent text-[12.5px] outline-none text-ink-strong"
              />
              {search && (
                <button type="button" onClick={() => handleSearch("")} className="text-ink-dim">
                  <Icon name="close" size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl overflow-hidden bg-panel border border-line">
            {filtered.length === 0 ? (
              <EmptyState
                icon="menu_book"
                title={trades.length === 0 ? "No trades yet" : "No trades match"}
                body={
                  trades.length === 0
                    ? "Log your first trade to start building your performance record."
                    : "Try adjusting your filter or search."
                }
                action={
                  trades.length === 0 ? (
                    <Button type="button" variant="primary" icon="add_task" onClick={() => setLogOpen(true)}>
                      Log trade
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-line">
                        {[
                          { label: "Date",    cls: "" },
                          { label: "Pair",    cls: "" },
                          { label: "Model",   cls: "hidden lg:table-cell" },
                          { label: "Session", cls: "hidden xl:table-cell" },
                          { label: "R:R",     cls: "hidden lg:table-cell text-right" },
                          { label: "P&L",     cls: "text-right" },
                          { label: "Rating",  cls: "hidden xl:table-cell" },
                          { label: "Rules",   cls: "hidden lg:table-cell text-center" },
                          { label: "",        cls: "" },
                        ].map((h) => (
                          <th
                            key={h.label}
                            className={`px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-dim ${h.cls}`}
                          >
                            {h.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((t) => (
                        <TradeRow
                          key={t.id}
                          trade={t}
                          onView={(id) => router.push(`/journal/${id}`)}
                          onEdit={() => { setEditing(t); setLogOpen(true); }}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={page} total={filtered.length} onChange={setPage} />
              </>
            )}
          </div>
        </div>

        {/* ── Right: analytics ── */}
        <AnalyticsPanel trades={trades} />
      </div>

      {/* ── Log / edit modal ── */}
      <LogTradeModal
        open={logOpen}
        onClose={() => { setLogOpen(false); setEditing(null); }}
        edit={editing}
      />
    </div>
  );
}
