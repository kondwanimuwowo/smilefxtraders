"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { PlanCard } from "./PlanCard";
import type { PlanMeta, PlanPrices } from "@/lib/plans";

interface Props {
  meta: PlanMeta;
  prices: PlanPrices;
  annual?: boolean;
}

export function MarketingPlanCard({ meta, prices, annual = false }: Props) {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setAuthed(!!s));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <PlanCard
      meta={meta}
      prices={prices}
      annual={annual}
      renderCta={(m) => (
        <Button
          href={m.id === "free" ? "/signup" : authed ? `/checkout/${m.id}` : `/signup?plan=${m.id}`}
          hardNav={m.id !== "free"}
          variant={m.popular ? "primary" : "ghost"}
          fullWidth
        >
          {m.id === "free" ? "Get started free" : m.id === "edge" ? "Start Edge" : "Join Pro"}
        </Button>
      )}
    />
  );
}
