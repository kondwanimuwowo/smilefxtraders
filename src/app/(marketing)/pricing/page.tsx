import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PRICES } from "@/lib/plans";
import type { PlanPrices } from "@/lib/plans";
import { PricingContent } from "./PricingContent";

export const revalidate = 300; // re-fetch prices every 5 min

export const metadata: Metadata = {
  title: "Pricing — Smile FX Traders",
  description: "Simple plans that grow with you — from a free Starter tier to the Funded Track with mentorship. Prices in USD and Zambian Kwacha.",
};

export default async function PricingPage() {
  const rows = await prisma.planConfig.findMany();
  const byId = Object.fromEntries(rows.map((r) => [r.planId, r]));

  const prices: PlanPrices[] = DEFAULT_PRICES.map((d) => ({
    planId:     d.planId,
    monthlyZmw: byId[d.planId]?.monthlyZmw ?? d.monthlyZmw,
    annualZmw:  byId[d.planId]?.annualZmw  ?? d.annualZmw,
    monthlyUsd: byId[d.planId]?.monthlyUsd ?? d.monthlyUsd,
    annualUsd:  byId[d.planId]?.annualUsd  ?? d.annualUsd,
  }));

  return <PricingContent prices={prices} />;
}
