"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  PAIRS_ORDER, PAIR_LABELS, fmtNotional, notionalInMillions,
  type FxOrderRecord,
} from "@/types/fx-orders";
import type { FxLevel } from "@/types/fx-orders";

// ── Helpers ───────────────────────────────────────────────────────────────────

const PIP_SIZE: Record<string, number> = {
  EURUSD: 0.0001, GBPUSD: 0.0001, AUDUSD: 0.0001,
  NZDUSD: 0.0001, USDCHF: 0.0001, USDCAD: 0.0001,
  EURGBP: 0.0001, USDJPY: 0.01,   XAUUSD: 0.1,
};

function parseSpot(s: string | null): number | null {
  const n = parseFloat(s ?? "");
  return isNaN(n) ? null : n;
}

function fmtDay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

// ── Single level row ──────────────────────────────────────────────────────────

function LevelRow({ level, spot, pair }: { level: FxLevel; spot: number | null; pair: string }) {
  const pip    = PIP_SIZE[pair] ?? 0.0001;
  const price  = parseFloat(level.price);
  const dist   = spot !== null ? Math.abs(price - spot) / pip : null;
  const near   = dist !== null && dist <= 50;
  const above  = spot !== null && price > spot;
  const nm     = notionalInMillions(level);
  const huge   = nm >= 1000;

  const priceColor = near
    ? (above ? "var(--teal-bright)" : "var(--coral-bright)")
    : huge
      ? "var(--gold)"
      : "var(--ink-strong)";

  const rowBg = near
    ? (above ? "rgba(48,232,223,0.05)" : "rgba(255,89,66,0.05)")
    : "transparent";

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5"
      style={{ background: rowBg }}
    >
      {/* Large indicator dot */}
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{
          background: huge ? "var(--gold)" : near ? priceColor : "var(--track)",
        }}
      />

      {/* Price */}
      <span
        className={cn("tabular-nums text-[12.5px] flex-1 font-mono tracking-[0.01em]", level.large ? "font-bold" : "font-medium")}
        style={{ color: priceColor }}
      >
        {level.price}
      </span>

      {/* Notional */}
      <span
        className={cn("text-[11px] shrink-0", huge ? "text-gold" : "text-ink-dim", level.large ? "font-bold" : "font-normal")}
      >
        {fmtNotional(level)}
      </span>

      {/* Pip distance */}
      {near && dist !== null && (
        <span
          className={cn("text-[10px] font-semibold shrink-0 rounded-md px-1.5 py-0.5 font-mono", above ? "text-teal bg-[rgba(8,174,170,0.1)]" : "text-coral bg-[rgba(234,82,61,0.1)]")}
        >
          {Math.round(dist)}p
        </span>
      )}
    </div>
  );
}

// ── Pair card ─────────────────────────────────────────────────────────────────

function PairCard({ record, liveSpot }: { record: FxOrderRecord; liveSpot: string | null }) {
  // Prefer live price from Twelve Data; fall back to snapshot from image
  const spot   = parseSpot(liveSpot ?? record.spotPrice);
  const pip    = PIP_SIZE[record.pair] ?? 0.0001;
  const sorted = [...record.levels].sort((a, b) => parseFloat(b.price) - parseFloat(a.price));

  const hasAlert = spot !== null
    && sorted.some((l) => Math.abs(parseFloat(l.price) - spot) / pip <= 50);

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl overflow-hidden bg-panel border",
        hasAlert ? "border-[rgba(8,174,170,0.3)] shadow-[0_0_0_1px_rgba(8,174,170,0.1)]" : "border-line shadow-none"
      )}
    >
      {/* Card header */}
      <div className={cn("flex items-center justify-between px-4 py-3 border-b border-line", hasAlert ? "bg-[rgba(8,174,170,0.03)]" : "bg-panel-2")}>
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-[14px] tracking-[-0.01em] text-ink-strong">
            {PAIR_LABELS[record.pair] ?? record.pair}
          </span>
        </div>

        {/* Spot price — live from Twelve Data if available, else image snapshot */}
        {spot !== null && (
          <div className="flex flex-col items-end">
            <span className="tabular-nums text-[12px] font-semibold font-mono text-ink-mid">
              {liveSpot ?? record.spotPrice}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-ink-dim">
              {liveSpot ? "live" : "snapshot"}
            </span>
          </div>
        )}
      </div>

      {/* Levels list — flex-1 pushes footer to bottom */}
      <div className="flex flex-col px-2 py-2 gap-0.5 flex-1">
        {sorted.map((lvl, i) => (
          <LevelRow key={i} level={lvl} spot={spot} pair={record.pair} />
        ))}
      </div>

      {/* Footer — always at bottom */}
      <div className="px-4 py-2 text-[10.5px] mt-auto border-t border-line text-ink-dim">
        {sorted.length} level{sorted.length !== 1 ? "s" : ""} · 10am NY Cut
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FxOrdersDatePage() {
  const { date }  = useParams<{ date: string }>();
  const router    = useRouter();
  const [records,    setRecords]    = useState<FxOrderRecord[]>([]);
  const [liveSpots,  setLiveSpots]  = useState<Record<string, string>>({});
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    // Fetch records and live spot prices in parallel
    Promise.all([
      fetch(`/api/fx-orders/${date}`).then((r) => {
        if (!r.ok) throw new Error("No data for this date");
        return r.json() as Promise<FxOrderRecord[]>;
      }),
      fetch("/api/fx-orders/spot").then((r) => r.ok ? r.json() as Promise<Record<string, string>> : {}),
    ])
      .then(([data, spots]) => {
        setRecords(data);
        setLiveSpots(spots);
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [date]);

  // Sort: pairs with data in canonical order, extras appended
  const sortedRecords = useMemo(() => {
    const byPair = Object.fromEntries(records.map((r) => [r.pair, r]));
    const ordered = (PAIRS_ORDER as readonly string[])
      .map((p) => byPair[p])
      .filter(Boolean) as FxOrderRecord[];
    const extra = records.filter(
      (r) => !(PAIRS_ORDER as readonly string[]).includes(r.pair)
    );
    return [...ordered, ...extra];
  }, [records]);

  const totalLevels = records.reduce((s, r) => s + r.levels.length, 0);
  const largeLevels = records.reduce((s, r) => s + (r.levels as FxLevel[]).filter((l) => notionalInMillions(l) >= 1000).length, 0);
  const nearPairs   = useMemo(() => {
    return records.filter((r) => {
      const spot = parseSpot(liveSpots[r.pair] ?? r.spotPrice);
      const pip  = PIP_SIZE[r.pair] ?? 0.0001;
      if (!spot) return false;
      return (r.levels as FxLevel[]).some((l) => Math.abs(parseFloat(l.price) - spot) / pip <= 50);
    }).length;
  }, [records, liveSpots]);

  const fetchedAt = records[0]?.fetchedAt ?? null;

  return (
    <div className="view">

      {/* ── Back ── */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1.5 mb-5 text-[13px] font-semibold hover:opacity-75 active:scale-95 transition-all text-ink-dim"
      >
        <Icon name="arrow_back" size={16} />
        All dates
      </button>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-[22px] tracking-[-0.02em] text-ink-strong">
            {loading ? "Loading…" : error ? "No data" : fmtDay(date)}
          </h1>
          <p className="text-[13px] mt-0.5 text-ink-dim">
            FX option expiries · 10am New York Cut
          </p>
        </div>

        {!loading && !error && (
          <div className="flex items-center gap-3 flex-wrap text-[12.5px] text-ink-dim">
            <span className="flex items-center gap-1">
              <Icon name="currency_exchange" size={13} />
              {records.length} pairs
            </span>
            <span className="flex items-center gap-1">
              <Icon name="format_list_bulleted" size={13} />
              {totalLevels} levels
            </span>
            {largeLevels > 0 && (
              <span className="flex items-center gap-1 text-gold">
                <Icon name="star" size={13} fill />
                {largeLevels} ≥1bn
              </span>
            )}
            {nearPairs > 0 && (
              <span className="flex items-center gap-1 text-teal">
                <Icon name="near_me" size={13} fill />
                {nearPairs} pairs with near levels
              </span>
            )}
            {fetchedAt && (
              <span className="text-[11px]">
                Synced {new Date(fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Legend ── */}
      {!loading && !error && (
        <div className="flex items-center gap-4 flex-wrap rounded-xl px-4 py-2.5 mb-5 bg-panel-2 border border-line">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-dim">Key</span>
          <div className="flex items-center gap-1.5 text-[11.5px] text-teal-bright">
            <div className="w-2 h-2 rounded-full bg-teal-bright" />
            Level above spot ≤50 pips
          </div>
          <div className="flex items-center gap-1.5 text-[11.5px] text-coral-bright">
            <div className="w-2 h-2 rounded-full bg-coral-bright" />
            Level below spot ≤50 pips
          </div>
          <div className="flex items-center gap-1.5 text-[11.5px] text-gold">
            <div className="w-2 h-2 rounded-full bg-gold" />
            Large ≥$1bn notional
          </div>
          <div className="flex items-center gap-1.5 text-[11.5px] text-ink-dim">
            <span className="text-[10px] font-bold rounded-md px-1 py-0.5 bg-[rgba(8,174,170,0.1)] text-teal font-mono">
              25p
            </span>
            pip distance from spot
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="rounded-2xl px-5 py-4 text-[13px] bg-[rgba(234,82,61,0.06)] border border-[rgba(234,82,61,0.2)] text-coral">
          {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} h={180} r={16} />)}
        </div>
      )}

      {/* ── Pair cards grid ── */}
      {!loading && !error && (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
        >
          {sortedRecords.map((rec) => (
            <PairCard key={rec.pair} record={rec} liveSpot={liveSpots[rec.pair] ?? null} />
          ))}
        </div>
      )}

    </div>
  );
}
