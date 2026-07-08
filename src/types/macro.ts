import type { IndicatorType, BiasLabel } from "@prisma/client";

export interface MacroBreakdownEntry {
  indicatorType: IndicatorType;
  signal: number;
  weight: number;
  weightedContribution: number;
  reason: string;
}

export interface CurrencyScore {
  currency: string;
  totalScore: number;
  breakdown: MacroBreakdownEntry[];
  computedAt: string;
  inputHash: string;
}

export interface PairBias {
  pair: string;
  baseCurrency: string;
  quoteCurrency: string;
  baseScore: number;
  quoteScore: number;
  differential: number;
  biasLabel: BiasLabel;
  computedAt: string;
  inputHash: string;
}

export interface MacroScoresResponse {
  scores: CurrencyScore[];
  pairBiases: PairBias[];
}

export interface MacroNewsItem {
  id: string;
  currency: string | null;
  headline: string;
  summary: string | null;
  url: string;
  source: string;
  publishedAt: string;
}
