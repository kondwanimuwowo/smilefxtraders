import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET current currency scores — read-only, no auth (mirrors /api/calendar's
// public-within-app-shell pattern). Returns whatever's been computed so far;
// an empty array is a valid response before the first recompute has run.
export async function GET() {
  const scores = await prisma.currentCurrencyScore.findMany({
    orderBy: { totalScore: "desc" },
  });
  return NextResponse.json(scores);
}
