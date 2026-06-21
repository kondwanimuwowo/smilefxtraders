import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PAIRS_ORDER } from "@/types/fx-orders";
import type { FxDateSummary, FxLevel } from "@/types/fx-orders";

export const revalidate = 1800; // 30 min

export async function GET() {
  try {
    const rawDateKeys = await prisma.fxOptionExpiry
      .groupBy({
        by:      ["expiryDate"],
        _count:  { pair: true },
        orderBy: { expiryDate: "desc" },
        take:    60, // ~3 months of trading days
      });

    // FX option expiries are only published on trading days. Never surface a
    // Saturday/Sunday date — these only ever appear from a bad parse, and the
    // market is closed over the weekend.
    const dateKeys = rawDateKeys.filter((g) => {
      const dow = g.expiryDate.getUTCDay();
      return dow !== 0 && dow !== 6;
    });

    const dates = dateKeys.map((g) => g.expiryDate);
    const allRecords = await prisma.fxOptionExpiry.findMany({
      where:  { expiryDate: { in: dates } },
      select: { expiryDate: true, pair: true, levels: true },
    });

    // Build per-date maps for level counts and actual pairs
    const levelCounts = new Map<string, number>();
    const pairSets    = new Map<string, Set<string>>();

    for (const r of allRecords) {
      const key  = r.expiryDate.toISOString().slice(0, 10);
      const lvls = r.levels as unknown as FxLevel[];
      levelCounts.set(key, (levelCounts.get(key) ?? 0) + (Array.isArray(lvls) ? lvls.length : 0));
      if (!pairSets.has(key)) pairSets.set(key, new Set());
      pairSets.get(key)!.add(r.pair);
    }

    const summaries: FxDateSummary[] = dateKeys.map((g) => {
      const dateStr    = g.expiryDate.toISOString().slice(0, 10);
      const dow        = new Date(g.expiryDate).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
      const pairsForDate = pairSets.get(dateStr) ?? new Set<string>();
      // Return pairs in canonical order, only those that actually have data
      const pairs = (PAIRS_ORDER as readonly string[]).filter((p) => pairsForDate.has(p));

      return {
        date:       dateStr,
        dayName:    dow,
        pairCount:  g._count.pair,
        levelCount: levelCounts.get(dateStr) ?? 0,
        pairs,
      };
    });

    return NextResponse.json(summaries);
  } catch (err) {
    console.error("[fx-orders]", err);
    return NextResponse.json({ error: "Failed to load dates" }, { status: 500 });
  }
}
