import { SessionTimeline } from "@/components/ui";
import { cn } from "@/lib/cn";

export const metadata = { title: "Market Sessions | Smile FX Traders" };

// ── Static session guide data ─────────────────────────────────────────────────

const SESSION_GUIDE = [
  {
    name:    "Sydney",
    time:    "23:00 – 08:00",
    textCls: "text-ink-mid",
    borderCls: "border-[rgba(160,160,160,0.35)]",
    bgCls:   "bg-[rgba(160,160,160,0.06)]",
    pairs:   ["AUD/USD", "NZD/USD", "USD/JPY"],
    note:    "Low-volatility open. Sets the weekly range on Sundays. Good for identifying liquidity pools before London arrives.",
  },
  {
    name:    "Tokyo",
    time:    "02:00 – 11:00",
    textCls: "text-gold",
    borderCls: "border-[rgba(248,185,61,0.35)]",
    bgCls:   "bg-[rgba(248,185,61,0.06)]",
    pairs:   ["USD/JPY", "AUD/USD", "NZD/USD", "EUR/JPY"],
    note:    "Asian range consolidation. EQH/EQL targets form here. Watch for SMT divergence between correlated JPY pairs.",
  },
  {
    name:    "Frankfurt",
    time:    "08:00 – 17:00",
    textCls: "text-teal",
    borderCls: "border-[rgba(8,174,170,0.35)]",
    bgCls:   "bg-[rgba(8,174,170,0.06)]",
    pairs:   ["EUR/USD", "GBP/USD", "USD/CHF"],
    note:    "European pre-open. Frankfurt often sweeps Asian session highs/lows before London continuation. Clean BOS setups.",
  },
  {
    name:    "London",
    time:    "09:00 – 18:00",
    textCls: "text-teal-bright",
    borderCls: "border-[rgba(48,232,223,0.35)]",
    bgCls:   "bg-[rgba(48,232,223,0.06)]",
    pairs:   ["EUR/USD", "GBP/USD", "GBP/JPY", "XAU/USD"],
    note:    "Highest volume session. Most BOS and CHoCH signals print here. London open (09:00–10:00) is a prime killzone, key for OB entries.",
  },
  {
    name:    "New York",
    time:    "14:00 – 23:00",
    textCls: "text-coral-bright",
    borderCls: "border-[rgba(255,89,66,0.35)]",
    bgCls:   "bg-[rgba(255,89,66,0.06)]",
    pairs:   ["EUR/USD", "GBP/USD", "USD/CAD", "XAU/USD", "NAS100"],
    note:    "NY open (14:00–16:00) overlaps London, producing the day's strongest directional move. News drives displacement. Hunt OB+FVG confluences.",
  },
];

const KILLZONES = [
  {
    name:  "London Open",
    time:  "09:00 – 10:00",
    textCls: "text-teal-bright",
    barCls: "bg-teal-bright",
    desc:  "First hour of European session. Institutional orders execute, structure shifts occur. High probability for BOS entries on the 15m–1h.",
  },
  {
    name:  "London–NY Overlap",
    time:  "14:00 – 18:00",
    textCls: "text-teal",
    barCls: "bg-teal",
    desc:  "Both institutional desks active simultaneously. Strongest 4-hour window of the day. Clean FVG sweeps and trend continuation moves.",
  },
  {
    name:  "NY Open",
    time:  "14:00 – 16:00",
    textCls: "text-coral-bright",
    barCls: "bg-coral-bright",
    desc:  "US equity and bond markets open. News catalysts drive sharp displacement. Best for momentum entries after London sets the direction.",
  },
  {
    name:  "NY Close",
    time:  "21:00 – 23:00",
    textCls: "text-coral",
    barCls: "bg-coral",
    desc:  "End-of-day position squaring. Liquidity pools above/below session highs targeted. Not a primary setup window but useful for exits.",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SessionsPage() {
  return (
    <div className="view">

      {/* ── Header ── */}
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.26em] mb-1.5 text-teal">
          GMT+2 · Africa / Lusaka
        </div>
        <h1 className="font-display font-bold leading-tight text-[28px] tracking-[-0.02em] text-ink-strong">
          Market Sessions
        </h1>
        <p className="text-[13.5px] mt-2 max-w-xl leading-relaxed text-ink-dim">
          Live session status in your timezone. Active sessions glow on the timeline. Overlapping killzones are the highest-probability windows for SMC setups.
        </p>
      </div>

      {/* ── Session Timeline ── */}
      <SessionTimeline />

      {/* ── Session Guide ── */}
      <div className="mt-10">
        <h2 className="font-display font-bold mb-1 text-[18px] tracking-[-0.015em] text-ink-strong">
          Session Guide
        </h2>
        <p className="text-[13px] mb-5 text-ink-dim">
          Key characteristics and pairs for each global session.
        </p>

        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {SESSION_GUIDE.map((s) => (
            <div key={s.name} className={cn("rounded-2xl p-4 border", s.bgCls, s.borderCls)}>
              {/* Session name + time */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className={cn("font-display font-bold text-[15px] tracking-[-0.01em]", s.textCls)}>
                    {s.name}
                  </div>
                  <div className="text-[11px] font-semibold mt-0.5 tabular-nums font-mono text-ink-dim">
                    {s.time} GMT+2
                  </div>
                </div>
              </div>

              {/* Pairs */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {s.pairs.map((p) => (
                  <span
                    key={p}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-lg tabular-nums font-mono bg-panel text-ink-mid border border-line"
                  >
                    {p}
                  </span>
                ))}
              </div>

              {/* Note */}
              <p className="text-[12px] leading-relaxed text-ink-dim">
                {s.note}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Killzone Reference ── */}
      <div className="mt-10 mb-2">
        <h2 className="font-display font-bold mb-1 text-[18px] tracking-[-0.015em] text-ink-strong">
          Killzone Reference
        </h2>
        <p className="text-[13px] mb-5 text-ink-dim">
          High-probability windows when institutional order flow is strongest. All times GMT+2.
        </p>

        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {KILLZONES.map((k) => (
            <div key={k.name} className="rounded-2xl p-4 flex gap-3 bg-panel border border-line">
              {/* Color accent bar */}
              <div className={cn("shrink-0 w-0.5 rounded-full", k.barCls)} />
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-display font-bold text-[13.5px] tracking-[-0.01em] text-ink-strong">
                    {k.name}
                  </span>
                  <span className={cn("text-[10.5px] font-semibold tabular-nums font-mono", k.textCls)}>
                    {k.time}
                  </span>
                </div>
                <p className="text-[12px] leading-relaxed text-ink-dim">
                  {k.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
