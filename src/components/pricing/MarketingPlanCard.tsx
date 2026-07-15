"use client";

import { Button } from "@/components/ui";
import { PlanCard } from "./PlanCard";
import type { PlanMeta, PlanPrices } from "@/lib/plans";

interface Props {
  meta: PlanMeta;
  prices: PlanPrices;
  annual?: boolean;
}

export function MarketingPlanCard({ meta, prices, annual = false }: Props) {
  return (
    <PlanCard
      meta={meta}
      prices={prices}
      annual={annual}
      renderCta={(m) => (
        <Button
          href={m.id === "free" ? "/signup" : `/signup?plan=${m.id}`}
          variant={m.popular ? "primary" : "ghost"}
          fullWidth
        >
          {m.id === "free" ? "Get started free" : m.id === "edge" ? "Start Edge" : "Join Pro"}
        </Button>
      )}
    />
  );
}
