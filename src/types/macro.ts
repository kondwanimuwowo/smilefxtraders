import type { IndicatorType, BiasLabel } from "@/generated/prisma/client";

// Mirrors src/lib/macro/confidence.ts's FitnessTier — kept as a separate
// literal union here rather than imported, since this file is also read by
// client components that shouldn't pull in server-only Prisma-adjacent code.
export type MacroFitnessTier = "high" | "usable" | "context_only" | "stale";

export interface MacroConfidenceSummary {
  tier: MacroFitnessTier;
  highWeight: number;
  usableWeight: number;
  contextWeight: number;
  staleWeight: number;
  totalWeight: number;
}

export interface MacroBreakdownEntry {
  indicatorType: IndicatorType;
  signal: number;
  weight: number;
  weightedContribution: number;
  reason: string;
  confidence: MacroFitnessTier;
  asOf: string | null;
  ageDays: number | null;
  includedInScore: boolean;
}

export interface CurrencyScore {
  currency: string;
  totalScore: number;
  breakdown: MacroBreakdownEntry[];
  computedAt: string;
  inputHash: string;
  confidence: MacroConfidenceSummary;
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
