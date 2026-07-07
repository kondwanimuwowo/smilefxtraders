"use client";

import Link from "next/link";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";

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

// Subtle accent classes per group
const GROUP_ACCENT: Record<string, { barCls: string; hoverBorderCls: string; chipBgCls: string; chipTextCls: string; chipBorderCls: string }> = {
  "FX Majors":             { barCls: "bg-teal",  hoverBorderCls: "hover:border-teal",  chipBgCls: "bg-[color-mix(in_srgb,var(--teal)_12%,transparent)]",  chipTextCls: "text-teal",  chipBorderCls: "border-[color-mix(in_srgb,var(--teal)_25%,transparent)]" },
  "Commodities & Indices": { barCls: "bg-gold",  hoverBorderCls: "hover:border-gold",  chipBgCls: "bg-[color-mix(in_srgb,var(--gold)_12%,transparent)]",  chipTextCls: "text-gold",  chipBorderCls: "border-[color-mix(in_srgb,var(--gold)_25%,transparent)]" },
  "Dollar Index":          { barCls: "bg-coral", hoverBorderCls: "hover:border-coral", chipBgCls: "bg-[color-mix(in_srgb,var(--coral)_12%,transparent)]", chipTextCls: "text-coral", chipBorderCls: "border-[color-mix(in_srgb,var(--coral)_25%,transparent)]" },
};

export default function PairsPage() {
  const totalPairs = GROUPS.reduce((s, g) => s + g.pairs.length, 0);

  return (
    <div className="view">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-[26px] tracking-[-0.025em] text-ink-strong">
            Pair Overviews
          </h1>
          <p className="text-[13px] mt-1 text-ink-dim">
            Select a pair for its COT bias, trend alignment, DXY confluence, and key levels.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5 shrink-0 bg-panel border border-line">
          <Icon name="currency_exchange" size={16} className="text-teal" />
          <span className="font-display font-bold text-[18px] text-ink-strong">
            {totalPairs}
          </span>
          <span className="text-[12px] text-ink-dim">instruments</span>
        </div>
      </div>

      {/* ── Groups ── */}
      <div className="flex flex-col gap-10">
        {GROUPS.map((group) => {
          const accent = GROUP_ACCENT[group.label];
          return (
            <section key={group.label}>
              {/* Group heading */}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("w-1 h-5 rounded-full shrink-0", accent.barCls)} />
                <div>
                  <h2 className="font-display font-bold text-[15px] tracking-[-0.01em] text-ink-strong">
                    {group.label}
                  </h2>
                  <p className="text-[12px] mt-0.5 text-ink-dim">
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
                    className={cn("group flex flex-col rounded-2xl overflow-hidden transition-all duration-150 bg-panel border border-line", accent.hoverBorderCls)}
                  >
                    {/* Top — pair name */}
                    <div className="px-5 pt-5 pb-4 border-b border-line bg-panel-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-display font-bold leading-none text-[22px] tracking-[-0.02em] text-ink-strong">
                            {pair}
                          </div>
                          <div className="text-[12px] mt-1.5 text-ink-dim">
                            {label}
                          </div>
                        </div>
                        <Icon
                          name="arrow_forward"
                          size={16}
                          className="text-ink-dim shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5"
                        />
                      </div>
                    </div>

                    {/* Bottom — chips */}
                    <div className="px-5 py-3.5 flex items-center justify-between gap-3">
                      {/* Base / quote chips */}
                      <div className="flex items-center gap-1.5">
                        <span className={cn("text-[10.5px] font-bold px-2 py-0.5 rounded-md border", accent.chipBgCls, accent.chipTextCls, accent.chipBorderCls)}>
                          {base}
                        </span>
                        {quote && (
                          <>
                            <span className="text-[10px] text-ink-dim">/</span>
                            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-panel-2 text-ink-dim border border-line">
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
                            className="text-[10px] font-semibold text-ink-dim"
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
