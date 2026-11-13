// One line that says what to do when the pair hub's technical verdict
// (COT + HTF trend + DXY) and MacroEdge's fundamental bias are read together.
// Before this, the two sat in separate panels with a note that they "can
// disagree", and the trader was left to work out what a disagreement means.

export type Direction = 1 | 0 | -1;

export type ReconcileKind = "agree" | "conflict" | "macro_only" | "tech_only" | "none";

export interface Reconciled {
  kind:  ReconcileKind;
  title: string;
  body:  string;
}

export function macroDirection(biasLabel: string | null | undefined): Direction {
  if (biasLabel === "STRONG_BUY" || biasLabel === "BUY") return 1;
  if (biasLabel === "STRONG_SELL" || biasLabel === "SELL") return -1;
  return 0;
}

const word = (d: Direction) => (d > 0 ? "bullish" : "bearish");
const side = (d: Direction) => (d > 0 ? "longs" : "shorts");

export function reconcileBias(tech: Direction, macro: Direction): Reconciled {
  if (tech !== 0 && tech === macro) {
    return {
      kind:  "agree",
      title: `Technicals and fundamentals agree: ${word(tech)}`,
      body:  `This is the cleanest backdrop for ${side(tech)}. Take setups in that direction at your normal size.`,
    };
  }
  if (tech !== 0 && macro !== 0) {
    return {
      kind:  "conflict",
      title: `Technicals read ${word(tech)}, fundamentals read ${word(macro)}`,
      body:  "Trade pullbacks only. Take profit at the next opposing zone, size down, and don't hold for a reversal until one side gives way.",
    };
  }
  if (macro !== 0) {
    return {
      kind:  "macro_only",
      title: `Fundamentals lean ${word(macro)}, technicals have no clear view`,
      body:  "Wait for structure to confirm before leaning on the fundamental read. On its own it says where price may drift, not when.",
    };
  }
  if (tech !== 0) {
    return {
      kind:  "tech_only",
      title: `Technicals lean ${word(tech)}, fundamentals are neutral`,
      body:  "Treat it as a short-term edge. Nothing in the data underneath supports holding it for long.",
    };
  }
  return {
    kind:  "none",
    title: "No direction from technicals or fundamentals",
    body:  "Stand aside or trade the range edges this week.",
  };
}
