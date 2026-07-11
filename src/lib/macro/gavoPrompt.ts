// Layer 6 — Gavo narration prompt builders. Mirrors /api/review/route.ts's
// structure (persona + rules as a cached system prompt, an interpolated user
// message) with one deliberate difference: plain narration text, not
// structured JSON. The trade-review endpoint needs JSON because its UI slots
// grade/good/improve/tip into separate sections; MacroEdge's output is a
// single flowing passage, which fits narration better than a forced schema.
//
// Gavo is only ever handed numbers Layers 1-5 already computed — it narrates,
// it never computes a score or bias itself. See the plan's "Solid" section.

import type { BreakdownEntry } from "./scoring";
import type { ConfluenceSummary } from "./confluence";

export const GAVO_MACRO_SYSTEM_PROMPT = `You are Gavo, the Smile FX Traders AI trading coach. You narrate macro-fundamental analysis for Smart Money Concepts (SMC) traders.

## Style
- Be authoritative, specific, and educational. Never hedge with disclaimers like "this is not financial advice" or "always do your own research"
- Lead with the strongest-weighted driver behind the score or bias you're given
- Cite actual numbers from the data you're handed — never say "strong" or "weak" without a figure attached
- State the bias plainly. Don't sit on the fence
- When technical confluence data is provided, address it explicitly: say whether it agrees or conflicts with the fundamental read, and what that means practically
- Reference SMC concepts (FVG, OB, liquidity, killzones, HTF bias) naturally where they connect to the macro picture, but don't force them in if there's no real connection
- Close with one concrete, actionable framing for the trader — never "do your own research" as a cop-out
- Write in plain punctuation: never use em dashes. Use commas, colons, or separate sentences instead
- Write like a person, not a language model. Avoid: "it's not just X, it's Y" constructions, forced groups of three, staccato fragment chains ("No hedging. No doubt. Pure conviction."), aphorisms ("price is the language of liquidity"), and openers like "Here's the thing" or "Let's break this down"
- Prefer "is" and "has" over "serves as", "boasts", or "stands as". Say the concrete thing
- 3-5 sentences. This is a narration, not a report — be precise and get out`;

function fmtBreakdown(breakdown: BreakdownEntry[]): string {
  if (breakdown.length === 0) return "no indicator data available";
  return breakdown
    .map((b) => `${b.indicatorType} ${b.weightedContribution > 0 ? "+" : ""}${b.weightedContribution.toFixed(1)} (${b.reason})`)
    .join("; ");
}

export function buildCurrencyExplainMessage(ctx: {
  currency: string;
  totalScore: number;
  breakdown: BreakdownEntry[];
}): string {
  return [
    `Explain the current fundamental score for ${ctx.currency}.`,
    `Total weighted score: ${ctx.totalScore > 0 ? "+" : ""}${ctx.totalScore.toFixed(1)}`,
    `Indicator breakdown: ${fmtBreakdown(ctx.breakdown)}`,
  ].join("\n");
}

export function buildPairExplainMessage(ctx: {
  pair: string;
  baseCurrency: string;
  quoteCurrency: string;
  baseScore: number;
  quoteScore: number;
  differential: number;
  biasLabel: string;
  baseBreakdown: BreakdownEntry[];
  quoteBreakdown: BreakdownEntry[];
  confluence: ConfluenceSummary;
}): string {
  const confluenceLine =
    ctx.confluence.agreement === "agree"
      ? `Technical confluence AGREES: TrendMatrix reads ${ctx.confluence.trendBias} (${ctx.confluence.trendCount}/5 timeframes), COT positioning reads ${ctx.confluence.cotSignal}.`
      : ctx.confluence.agreement === "conflict"
        ? `Technical confluence CONFLICTS: TrendMatrix reads ${ctx.confluence.trendBias} (${ctx.confluence.trendCount}/5 timeframes), but COT positioning reads ${ctx.confluence.cotSignal}.`
        : "Not enough technical data (TrendMatrix/COT) yet for a confluence read.";

  return [
    `Explain the current fundamental bias for ${ctx.pair}.`,
    `Bias: ${ctx.biasLabel} (differential ${ctx.differential > 0 ? "+" : ""}${ctx.differential.toFixed(1)})`,
    `${ctx.baseCurrency} score: ${ctx.baseScore > 0 ? "+" : ""}${ctx.baseScore.toFixed(1)} — ${fmtBreakdown(ctx.baseBreakdown)}`,
    `${ctx.quoteCurrency} score: ${ctx.quoteScore > 0 ? "+" : ""}${ctx.quoteScore.toFixed(1)} — ${fmtBreakdown(ctx.quoteBreakdown)}`,
    confluenceLine,
  ].join("\n");
}
