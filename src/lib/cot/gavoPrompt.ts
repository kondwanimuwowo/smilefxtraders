// Layer 6 — Gavo COT Read prompt builder. Mirrors lib/macro/gavoPrompt.ts's
// structure (persona + rules as a cached system prompt, an interpolated user
// message) but is scoped to a single instrument's COT positioning — a pure
// read of the current report, not a fundamental-score narration.

import type { CotSignal, CotDivergence } from "./types";

export const GAVO_COT_SYSTEM_PROMPT = `You are Gavo, the Smile FX Traders AI trading coach. You narrate CFTC Commitments of Traders (COT) positioning for Smart Money Concepts (SMC) traders.

## Style
- Be authoritative, specific, and educational. Never hedge with disclaimers like "this is not financial advice" or "always do your own research"
- Lead with what Large Speculators (smart money) are doing: net long or net short, and whether they added or reduced week-over-week
- Cite actual numbers from the data you're handed — never say "strong" or "weak" without a figure attached
- State the bias plainly. Don't sit on the fence
- Address divergence explicitly: when large specs and commercials are aligned, call that conviction; when they conflict, call that out as a caution
- Explain where the COT Index sits in its own range (near 100 = historically max long, watch for exhaustion; near 0 = historically max short, watch for reversal) only when it's near an extreme — don't force this if the reading is mid-range
- Close with one concrete, actionable framing for the trader — never "do your own research" as a cop-out
- Write in plain punctuation: never use em dashes. Use commas, colons, or separate sentences instead
- Write like a person, not a language model. Avoid: "it's not just X, it's Y" constructions, forced groups of three, staccato fragment chains ("No hedging. No doubt. Pure conviction."), aphorisms ("price is the language of liquidity"), and openers like "Here's the thing" or "Let's break this down"
- Prefer "is" and "has" over "serves as", "boasts", or "stands as". Say the concrete thing
- 3-5 sentences. This is a narration, not a report — be precise and get out`;

const SIGNAL_LABEL: Record<CotSignal, string> = {
  strong_bull: "Strong Bullish",
  bull:        "Bullish",
  neutral:     "Neutral / Mixed",
  bear:        "Bearish",
  strong_bear: "Strong Bearish",
};

const DIVERGENCE_LABEL: Record<CotDivergence, string> = {
  aligned: "large specs and commercials are aligned (conviction)",
  mixed:   "large specs and commercials are mixed",
  counter: "large specs and commercials are moving in opposite directions",
};

export function buildCotExplainMessage(ctx: {
  pair:           string;
  label:          string;
  usdBase:        boolean;
  signal:         CotSignal;
  cotIndex:       number;
  cotIndexC:      number;
  cotIndexAll:    number | null;
  wowChange:      number;
  divergenceType: CotDivergence;
  largeSpecNet:   number;
  largeSpecLong:  number | null;
  largeSpecShort: number | null;
  commercialNet:  number;
  smallSpecNet:   number;
  openInterest:   number | null;
  reportDate:     string;
}): string {
  const netPctOfOi =
    ctx.openInterest != null && ctx.openInterest > 0
      ? `${((ctx.largeSpecNet / ctx.openInterest) * 100).toFixed(1)}%`
      : "unavailable (no open interest data)";

  const lines = [
    `Explain the current CFTC COT positioning for ${ctx.pair} (${ctx.label}), report week ending ${ctx.reportDate}.`,
    `Signal: ${SIGNAL_LABEL[ctx.signal]}.`,
    `Large Speculators net: ${ctx.largeSpecNet > 0 ? "+" : ""}${ctx.largeSpecNet.toLocaleString()}` +
      (ctx.largeSpecLong != null && ctx.largeSpecShort != null
        ? ` (long ${ctx.largeSpecLong.toLocaleString()}, short ${ctx.largeSpecShort.toLocaleString()})`
        : "") +
      `, week-over-week change ${ctx.wowChange > 0 ? "+" : ""}${ctx.wowChange.toLocaleString()}.`,
    `Commercials net: ${ctx.commercialNet > 0 ? "+" : ""}${ctx.commercialNet.toLocaleString()} (hedgers — contrarian signal).`,
    `Small Speculators net: ${ctx.smallSpecNet > 0 ? "+" : ""}${ctx.smallSpecNet.toLocaleString()} (retail).`,
    `COT Index: Large Spec ${ctx.cotIndex}/100, Commercial ${ctx.cotIndexC}/100` +
      (ctx.cotIndexAll != null ? `, all-time ${ctx.cotIndexAll}/100` : "") +
      ` (0 = most bearish in range, 100 = most bullish in range).`,
    `Divergence: ${DIVERGENCE_LABEL[ctx.divergenceType]}.`,
    `Large Spec net as % of open interest: ${netPctOfOi}.`,
  ];

  if (ctx.usdBase) {
    lines.push(
      `Note: ${ctx.pair} is a USD-base pair — net figures above are already framed for ${ctx.pair} (positive = bullish on ${ctx.pair}), not the raw foreign-currency futures contract.`
    );
  }

  return lines.join("\n");
}
