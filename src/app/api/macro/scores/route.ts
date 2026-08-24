import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";
import { summarizeConfidence } from "@/lib/macro/confidence";
import type { BreakdownEntry } from "@/lib/macro/scoring";

// GET current currency scores + pair biases — read-only, no auth (mirrors
// /api/calendar's public-within-app-shell pattern). Empty arrays are a valid
// response before the first recompute has run.
export async function GET() {
  try {
    const [rawScores, pairBiases] = await Promise.all([
      prisma.currentCurrencyScore.findMany({ orderBy: { totalScore: "desc" } }),
      prisma.currentPairBias.findMany({ orderBy: { pair: "asc" } }),
    ]);

    // confidence isn't a stored column (see scoring.ts) — derived here from
    // each score's already-persisted breakdown so the frontend doesn't need
    // its own copy of the fitness logic just to show a badge.
    const scores = rawScores.map((s) => ({
      ...s,
      confidence: summarizeConfidence(
        (s.breakdown as unknown as BreakdownEntry[]).map((b) => ({ weight: b.weight, confidence: b.confidence })),
      ),
    }));

    return NextResponse.json({ scores, pairBiases });
  } catch (err) {
    return handleApiError("macro/scores", err);
  }
}
