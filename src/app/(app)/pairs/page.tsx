"use client";

import Link from "next/link";
import { Icon } from "@/components/ui";

const GROUPS = [
  {
    label: "FX Majors",
    description: "The most liquid currency pairs, traded during the London and New York sessions",
    pairs: [
      { pair: "EURUSD", label: "Euro / US Dollar",        base: "EUR", quote: "USD" },
      { pair: "GBPUSD", label: "British Pound / US Dollar", base: "GBP", quote: "USD" },
      { pair: "AUDUSD", label: "Australian Dollar / USD",  base: "AUD", quote: "USD" },
      { pair: "NZDUSD", label: "NZ Dollar / US Dollar",    base: "NZD", quote: "USD" },
      { pair: "USDJPY", label: "US Dollar / Japanese Yen", base: "USD", quote: "JPY" },
      { pair: "USDCHF", label: "US Dollar / Swiss Franc",  base: "USD", quote: "CHF" },
      { pair: "USDCAD", label: "US Dollar / Canadian Dollar", base: "USD", quote: "CAD" },
    ],
  },
  {
    label: "Commodities & Indices",
    description: "Risk-sentiment instruments with a strong correlation to USD flows",
    pairs: [
      { pair: "XAUUSD", label: "Gold / US Dollar",   base: "XAU", quote: "USD" },
      { pair: "NAS100", label: "NASDAQ 100 E-mini",  base: "NAS", quote: "USD" },
    ],
  },
  {
    label: "Dollar Index",
    description: "The master bias: DXY direction sets the tone for all USD pairs simultaneously",
    pairs: [
      { pair: "DXY", label: "US Dollar Index", base: "USD", quote: "" },
    ],
  },
] as const;

const FEATURES = ["COT Bias", "Trend Matrix", "DXY Confluence"] as const;

// Subtle accent color per group
const GROUP_COLOR: Record<string, string> = {
  "FX Majors":              "var(--teal)",
  "Commodities & Indices":  "var(--gold)",
  "Dollar Index":           "var(--coral)",
};

export default function PairsPage() {
  const totalPairs = GROUPS.reduce((s, g) => s + g.pairs.length, 0);

  return (
    <div className="view">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1
            className="font-display font-bold"
            style={{ fontSize: 26, letterSpacing: "-0.025em", color: "var(--ink-strong)" }}
          >
            Pair Overviews
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--ink-dim)" }}>
            Select a pair for its COT bias, trend alignment, DXY confluence, and key levels.
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-2.5 shrink-0"
          style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
        >
          <Icon name="currency_exchange" size={16} style={{ color: "var(--teal)" }} />
          <span className="font-display font-bold text-[18px]" style={{ color: "var(--ink-strong)" }}>
            {totalPairs}
          </span>
          <span className="text-[12px]" style={{ color: "var(--ink-dim)" }}>instruments</span>
        </div>
      </div>

      {/* ── Groups ── */}
      <div className="flex flex-col gap-10">
        {GROUPS.map((group) => {
          const accent = GROUP_COLOR[group.label];
          return (
            <section key={group.label}>
              {/* Group heading */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-5 rounded-full shrink-0" style={{ background: accent }} />
                <div>
                  <h2
                    className="font-display font-bold text-[15px]"
                    style={{ color: "var(--ink-strong)", letterSpacing: "-0.01em" }}
                  >
                    {group.label}
                  </h2>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--ink-dim)" }}>
                    {group.description}
                  </p>
                </div>
              </div>

              {/* Pair cards */}
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                {group.pairs.map(({ pair, label, base, quote }) => (
                  <Link
                    key={pair}
                    href={`/pair/${pair}`}
                    className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-150"
                    style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = accent; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--line)"; }}
                  >
                    {/* Top — pair name */}
                    <div
                      className="px-5 pt-5 pb-4"
                      style={{ borderBottom: "1px solid var(--line)", background: "var(--panel-2)" }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div
                            className="font-display font-bold leading-none"
                            style={{ fontSize: 22, letterSpacing: "-0.02em", color: "var(--ink-strong)" }}
                          >
                            {pair}
                          </div>
                          <div className="text-[12px] mt-1.5" style={{ color: "var(--ink-dim)" }}>
                            {label}
                          </div>
                        </div>
                        <Icon
                          name="arrow_forward"
                          size={16}
                          style={{ color: "var(--ink-dim)", flexShrink: 0, marginTop: 3 }}
                          className="transition-transform group-hover:translate-x-0.5"
                        />
                      </div>
                    </div>

                    {/* Bottom — chips */}
                    <div className="px-5 py-3.5 flex items-center justify-between gap-3">
                      {/* Base / quote chips */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[10.5px] font-bold px-2 py-0.5 rounded-md"
                          style={{
                            background: `color-mix(in srgb, ${accent} 12%, transparent)`,
                            color: accent,
                            border: `1px solid color-mix(in srgb, ${accent} 25%, transparent)`,
                            fontFamily: "var(--mono)",
                          }}
                        >
                          {base}
                        </span>
                        {quote && (
                          <>
                            <span className="text-[10px]" style={{ color: "var(--ink-dim)" }}>/</span>
                            <span
                              className="text-[10.5px] font-bold px-2 py-0.5 rounded-md"
                              style={{
                                background: "var(--panel-2)",
                                color: "var(--ink-dim)",
                                border: "1px solid var(--line)",
                                fontFamily: "var(--mono)",
                              }}
                            >
                              {quote}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Feature dots */}
                      <div className="flex items-center gap-2">
                        {FEATURES.map((f) => (
                          <span
                            key={f}
                            className="text-[10px] font-semibold"
                            style={{ color: "var(--ink-dim)" }}
                            title={f}
                          >
                            {f.split(" ")[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
