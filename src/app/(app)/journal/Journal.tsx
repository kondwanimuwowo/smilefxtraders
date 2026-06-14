"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type { Trade } from "@/lib/store";
import { useTrades, useDeleteTrade } from "@/lib/hooks/useTrades";
import {
  Button, DirPill, Chip, StatTile, Stars, Icon, EmptyState, Panel,
} from "@/components/ui";
import { LogTradeModal } from "./LogTradeModal";

// ── Constants ──────────────────────────────────────────────────────────────────

const PAIRS   = ["EURUSD", "GBPUSD", "NZDUSD", "XAUUSD", "NAS100"];
const FILTERS = ["All", "Wins", "Losses", "Open"] as const;
type Filter   = typeof FILTERS[number];

const SESSION_COLORS: Record<string, string> = {
  London:   "var(--teal)",
  "New York": "var(--coral)",
  Asia:     "var(--gold)",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function pnlLabel(t: Trade) {
  if (t.result === "open") return "Open";
  if (t.pnlR > 0)  return `+${t.pnlR.toFixed(1)}R`;
  return `${t.pnlR.toFixed(1)}R`;
}
function pnlColor(t: Trade) {
  if (t.result === "open") return "var(--gold)";
  return t.pnlR >= 0 ? "var(--teal-bright)" : "var(--coral-bright)";
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

// ── AnalyticsPanel ────────────────────────────────────────────────────────────

function ModelBar({ model, pct, n }: { model: string; pct: number; n: number }) {
  const shortName = model.split("→")[0].split("+")[0].trim();
  return (
    <div className="flex items-center gap-2.5">
      <div className="text-[11.5px] font-medium min-w-0 flex-1 truncate" style={{ color: "var(--ink-mid)" }}>
        {shortName}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="relative h-1.5 rounded-full overflow-hidden" style={{ width: 80, background: "var(--track)" }}>
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: pct >= 60 ? "var(--teal)" : pct >= 40 ? "var(--gold)" : "var(--coral)" }}
          />
        </div>
        <span className="text-[11px] font-semibold tabular-nums" style={{ color: "var(--ink-dim)", width: 32, textAlign: "right" }}>
          {pct}%
        </span>
        <span className="text-[10px]" style={{ color: "var(--ink-dim)", width: 20 }}>
          /{n}
        </span>
      </div>
    </div>
  );
}

function SessionBar({ session, count, max }: { session: string; count: number; max: number }) {
  const pct = max ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[11.5px] font-medium" style={{ color: "var(--ink-mid)", width: 72 }}>{session}</span>
      <div className="flex-1 relative h-1.5 rounded-full overflow-hidden" style={{ background: "var(--track)" }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: SESSION_COLORS[session] ?? "var(--teal)" }}
        />
      </div>
      <span className="text-[11px] tabular-nums font-semibold" style={{ color: "var(--ink-dim)", width: 16, textAlign: "right" }}>
        {count}
      </span>
    </div>
  );
}

function AnalyticsPanel({ trades }: { trades: Trade[] }) {
  const { stats } = useTrades();

  const sessionCounts = useMemo(() => {
    const counts: Record<string, number> = { London: 0, "New York": 0, Asia: 0 };
    trades.forEach((t) => { if (t.session && t.session in counts) counts[t.session]++; });
    return counts;
  }, [trades]);
  const sessionMax = Math.max(...Object.values(sessionCounts), 1);

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

  return (
    <div className="flex flex-col gap-4">
      {/* Model performance */}
      <Panel>
        <div className="px-4 pt-4 pb-1">
          <div className="font-display font-semibold text-[14px] mb-3" style={{ color: "var(--ink-strong)" }}>
            Model win rate
          </div>
          {stats.models.length === 0 ? (
            <p className="text-[12px] py-3" style={{ color: "var(--ink-dim)" }}>
              No closed trades yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5 pb-3">
              {stats.models.slice(0, 6).map((m) => (
                <ModelBar key={m.model} model={m.model} pct={m.pct} n={m.n} />
              ))}
            </div>
          )}
        </div>
      </Panel>

      {/* Session breakdown */}
      <Panel>
        <div className="px-4 pt-4 pb-4">
          <div className="font-display font-semibold text-[14px] mb-3" style={{ color: "var(--ink-strong)" }}>
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
              <Icon name="warning" size={15} fill style={{ color: "var(--coral)" }} />
              <span className="font-display font-semibold text-[14px]" style={{ color: "var(--ink-strong)" }}>
                Recurring leaks
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {leaks.map(({ model, count }) => (
                <div key={model} className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: "var(--ink-mid)" }}>{model}</span>
                  <Chip tone="coral">{count}×</Chip>
                </div>
              ))}
            </div>
            <p className="text-[11.5px] leading-relaxed mt-3" style={{ color: "var(--ink-dim)" }}>
              Rule breaks on these setups. Review your checklist before entering.
            </p>
          </div>
        </Panel>
      )}

      {/* Avg win vs avg loss */}
      <Panel>
        <div className="px-4 pt-4 pb-4 grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--ink-dim)" }}>
              Avg win
            </div>
            <div
              className="font-display font-bold tabular-nums text-[20px]"
              style={{ color: "var(--teal-bright)", letterSpacing: "-0.01em" }}
            >
              +{stats.avgWin.toFixed(1)}R
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--ink-dim)" }}>
              Avg loss
            </div>
            <div
              className="font-display font-bold tabular-nums text-[20px]"
              style={{ color: "var(--coral-bright)", letterSpacing: "-0.01em" }}
            >
              {stats.avgLoss.toFixed(1)}R
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

// ── Trade table row ────────────────────────────────────────────────────────────

function TradeRow({ trade, onView, onEdit }: { trade: Trade; onView: (id: string) => void; onEdit: () => void }) {
  return (
    <tr
      className="group cursor-pointer transition-colors hover:bg-[var(--hover)]"
      onClick={() => onView(trade.id)}
    >
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-[12.5px] font-medium tabular-nums" style={{ color: "var(--ink-dim)" }}>
          {trade.date}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-[13.5px]" style={{ color: "var(--ink-strong)" }}>
            {trade.pair}
          </span>
          <DirPill dir={trade.dir} size="sm" />
          {trade.fromAlert && (
            <Icon name="notifications_active" size={13} fill style={{ color: "var(--gold)", flexShrink: 0 }} />
          )}
        </div>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <div className="text-[12px] max-w-[160px] truncate" style={{ color: "var(--ink-mid)" }}>
          {trade.model.split("→")[0].split("+")[0].trim()}
        </div>
      </td>
      <td className="px-4 py-3 hidden xl:table-cell">
        {trade.session && (
          <span className="text-[11.5px] font-medium" style={{ color: SESSION_COLORS[trade.session] ?? "var(--ink-dim)" }}>
            {trade.session}
          </span>
        )}
      </td>
      <td className="px-4 py-3 hidden lg:table-cell text-right">
        <span className="tabular-nums text-[12.5px]" style={{ color: "var(--ink-dim)" }}>
          {trade.rr ? `${trade.rr}:1` : "—"}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span
          className="font-display font-bold tabular-nums text-[14px]"
          style={{ color: pnlColor(trade), letterSpacing: "-0.01em" }}
        >
          {pnlLabel(trade)}
        </span>
      </td>
      <td className="px-4 py-3 hidden xl:table-cell">
        <Stars value={trade.rating ?? 0} size={13} />
      </td>
      <td className="px-4 py-3 hidden lg:table-cell text-center">
        <span
          className="material-symbols-rounded"
          style={{
            fontSize: 16,
            color: trade.discipline ? "var(--teal)" : "var(--coral)",
            fontVariationSettings: "'FILL' 1",
          }}
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
            className="p-1 rounded-lg hover:bg-[var(--hover)] transition-colors"
            style={{ color: "var(--ink-dim)" }}
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
    <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--line)" }}>
      <span className="text-[12px]" style={{ color: "var(--ink-dim)" }}>
        {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="p-1.5 rounded-lg hover:bg-[var(--hover)] disabled:opacity-30 transition-colors"
          style={{ color: "var(--ink-mid)" }}
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
              className="size-7 rounded-lg text-[12px] font-semibold transition-colors"
              style={
                page === p
                  ? { background: "var(--teal)", color: "#fff" }
                  : { color: "var(--ink-mid)" }
              }
            >
              {p}
            </button>
          );
        })}
        <button
          type="button"
          disabled={page === pages}
          onClick={() => onChange(page + 1)}
          className="p-1.5 rounded-lg hover:bg-[var(--hover)] disabled:opacity-30 transition-colors"
          style={{ color: "var(--ink-mid)" }}
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

  function handleFilterChange(f: Filter) {
    setFilter(f);
    setPage(1);
  }
  function handlePairToggle(pair: string) {
    setPair((p) => (p === pair ? null : pair));
    setPage(1);
  }
  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }
  function handleDelete(id: string) {
    deleteTrade(id);
    toast("Trade removed", "coral", "delete");
  }

  const netRTone = stats.netR > 0 ? "up" : stats.netR < 0 ? "down" : "neutral";

  return (
    <div className="view">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-display font-bold" style={{ fontSize: 24, letterSpacing: "-0.02em", color: "var(--ink-strong)" }}>
            Trade Journal
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--ink-dim)" }}>
            {trades.length === 0
              ? "Start logging trades to build your edge."
              : `${trades.length} trade${trades.length !== 1 ? "s" : ""} logged — ${stats.closed} closed`}
            {streak.n >= 3 && (
              <span
                className="ml-2 font-semibold"
                style={{ color: streak.type === "win" ? "var(--teal)" : "var(--coral)" }}
              >
                · {streak.n}
                {streak.type === "win" ? "W" : "L"} streak
              </span>
            )}
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
          label="Discipline"
          value={`${stats.discFollowed}%`}
          sub="Rules followed"
          tone={stats.discFollowed >= 80 ? "up" : stats.discFollowed >= 60 ? "gold" : "down"}
          icon="checklist"
        />
        <StatTile
          label="Open"
          value={String(trades.filter((t) => t.result === "open").length)}
          sub="Active positions"
          tone="gold"
          icon="radio_button_checked"
        />
      </div>

      {/* ── Main content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] gap-5">
        {/* ── Left: table ── */}
        <div className="flex flex-col gap-3">
          {/* Filter bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="flex items-center rounded-xl p-0.5"
              style={{ background: "var(--panel-2)", border: "1px solid var(--line)" }}
            >
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => handleFilterChange(f)}
                  className="px-3.5 py-1.5 rounded-[10px] text-[12.5px] font-semibold transition-all"
                  style={
                    filter === f
                      ? { background: "var(--panel)", color: "var(--ink-strong)", boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }
                      : { color: "var(--ink-dim)" }
                  }
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Pair chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {PAIRS.map((pair) => (
                <button
                  key={pair}
                  type="button"
                  onClick={() => handlePairToggle(pair)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                  style={
                    pairFilter === pair
                      ? { background: "var(--teal)", color: "#fff" }
                      : { background: "var(--panel-2)", color: "var(--ink-dim)", border: "1px solid var(--line)" }
                  }
                >
                  {pair}
                </button>
              ))}
            </div>

            {/* Search */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl flex-1 min-w-0"
              style={{ background: "var(--panel-2)", border: "1px solid var(--line)" }}
            >
              <Icon name="search" size={15} style={{ color: "var(--ink-dim)", flexShrink: 0 }} />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search pair, model, notes…"
                className="flex-1 bg-transparent text-[12.5px] outline-none"
                style={{ color: "var(--ink-strong)" }}
              />
              {search && (
                <button type="button" onClick={() => handleSearch("")} style={{ color: "var(--ink-dim)" }}>
                  <Icon name="close" size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
          >
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
                      <tr style={{ borderBottom: "1px solid var(--line)" }}>
                        {[
                          { label: "Date", cls: "" },
                          { label: "Pair", cls: "" },
                          { label: "Model", cls: "hidden lg:table-cell" },
                          { label: "Session", cls: "hidden xl:table-cell" },
                          { label: "R:R", cls: "hidden lg:table-cell text-right" },
                          { label: "P&L", cls: "text-right" },
                          { label: "Rating", cls: "hidden xl:table-cell" },
                          { label: "Rules", cls: "hidden lg:table-cell text-center" },
                          { label: "", cls: "" },
                        ].map((h) => (
                          <th
                            key={h.label}
                            className={`px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider ${h.cls}`}
                            style={{ color: "var(--ink-dim)" }}
                          >
                            {h.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody style={{ borderBottom: "1px solid transparent" }}>
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
