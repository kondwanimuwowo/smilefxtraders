import { requireInstructor } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PRICES } from "@/lib/plans";
import type { PlanPrices } from "@/lib/plans";
import { PricingAdmin } from "./PricingAdmin";

export default async function AdminPricingPage() {
  await requireInstructor();

  const rows = await prisma.planConfig.findMany();
  const byId = Object.fromEntries(rows.map((r) => [r.planId, r]));

  const prices: PlanPrices[] = DEFAULT_PRICES.map((d) => ({
    planId:     d.planId,
    monthlyZmw: byId[d.planId]?.monthlyZmw ?? d.monthlyZmw,
    annualZmw:  byId[d.planId]?.annualZmw  ?? d.annualZmw,
    monthlyUsd: byId[d.planId]?.monthlyUsd ?? d.monthlyUsd,
    annualUsd:  byId[d.planId]?.annualUsd  ?? d.annualUsd,
  }));

  return <PricingAdmin initial={prices} />;
}
