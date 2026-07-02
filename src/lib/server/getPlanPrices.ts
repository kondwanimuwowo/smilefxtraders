import { prisma } from "@/lib/prisma";
import { DEFAULT_PRICES } from "@/lib/plans";
import type { PlanPrices } from "@/lib/plans";

// Marketing pages must render even when the DB is unreachable —
// fall back to the seeded defaults rather than 500ing.
export async function getPlanPrices(): Promise<PlanPrices[]> {
  const rows = await prisma.planConfig.findMany().catch(() => []);
  const byId = Object.fromEntries(rows.map((r) => [r.planId, r]));

  return DEFAULT_PRICES.map((d) => ({
    planId:     d.planId,
    monthlyZmw: byId[d.planId]?.monthlyZmw ?? d.monthlyZmw,
    annualZmw:  byId[d.planId]?.annualZmw  ?? d.annualZmw,
    monthlyUsd: byId[d.planId]?.monthlyUsd ?? d.monthlyUsd,
    annualUsd:  byId[d.planId]?.annualUsd  ?? d.annualUsd,
  }));
}
