import type { IndicatorType } from "@prisma/client";

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
