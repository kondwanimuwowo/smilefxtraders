import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET current currency scores + pair biases — read-only, no auth (mirrors
// /api/calendar's public-within-app-shell pattern). Empty arrays are a valid
// response before the first recompute has run.
export async function GET() {
  const [scores, pairBiases] = await Promise.all([
    prisma.currentCurrencyScore.findMany({ orderBy: { totalScore: "desc" } }),
    prisma.currentPairBias.findMany({ orderBy: { pair: "asc" } }),
  ]);
  return NextResponse.json({ scores, pairBiases });
}
