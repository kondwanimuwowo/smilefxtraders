"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Icon, Chip } from "@/components/ui";
import { PlanCard } from "@/components/pricing/PlanCard";
import { FAQAccordion } from "@/components/marketing/FAQAccordion";
import { PLAN_META, DEFAULT_PRICES } from "@/lib/plans";
import type { PlanPrices } from "@/lib/plans";

function usePlanPrices() {
  return useQuery<PlanPrices[]>({
    queryKey: ["plan-prices"],
    queryFn: () => fetch("/api/admin/pricing").then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
    placeholderData: DEFAULT_PRICES,
  });
}

const FAQ = [
  { q: "Can I pay in Kwacha?",
    a: "Yes, all prices are in ZMW (Kwacha). Pay via Airtel Money, MTN MoMo, Zamtel Kwacha, or card." },
  { q: "Can I cancel at any time?",
    a: "Yes. No contracts, no lock-ins. Cancel from your settings and you keep access until the end of your billing period." },
  { q: "What is the Gavo AI Trade Review?",
    a: "After logging a trade, you can request a review from Gavo, our AI trading coach. Gavo grades your trade against the SMC rulebook, giving you a letter grade (A+–D), a verdict, what you did well, and what to improve." },
  { q: "What is the 1-on-1 mentorship?",
    a: "Pro members get monthly private video review sessions with Kondwani. He reviews your journal, identifies patterns in your trading, and gives you a personalised improvement plan." },
  { q: "Is there a free trial for Pro?",
    a: "Not currently. The Starter plan is free forever and gives you access to all the tools. You only need to upgrade when you want unlimited journal entries and live alerts." },
];

export function Pricing() {
  const { user } = useStore();
  const router = useRouter();
  const [annual, setAnnual] = useState(false);
  const currentPlan = user?.plan ?? "free";

  const { data: allPrices = DEFAULT_PRICES } = usePlanPrices();

  return (
    <div className="view">
      <div className="text-center mb-8">
        <h1 className="font-display font-medium text-[30px] tracking-[-0.03em] text-ink-strong">
          Simple, transparent pricing
        </h1>
        <p className="text-[15px] mt-2 max-w-lg mx-auto text-ink-dim">
          Built for Zambian traders. All prices in ZMW (Kwacha).
        </p>
        <div className="flex items-center justify-center gap-3 mt-5">
          <span className={`text-[13.5px] font-medium ${annual ? "text-ink-dim" : "text-ink-strong"}`}>Monthly</span>
          <button
            type="button"
            onClick={() => setAnnual((a) => !a)}
            className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${annual ? "bg-teal" : "bg-track"}`}
          >
            <span
              className={`inline-block size-5 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${annual ? "translate-x-5" : "translate-x-0.5"}`}
            />
          </button>
          <span className={`text-[13.5px] font-medium ${annual ? "text-ink-strong" : "text-ink-dim"}`}>Annual</span>
          {annual && <Chip tone="teal">Save 20%</Chip>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12 items-start pt-4">
        {PLAN_META.map((meta) => {
          const prices = allPrices.find((p) => p.planId === meta.id) ?? DEFAULT_PRICES.find((p) => p.planId === meta.id)!;
          const isCurrent = currentPlan === meta.id;

          return (
            <PlanCard
              key={meta.id}
              meta={meta}
              prices={prices}
              annual={annual}
              renderCta={(m) => {
                if (isCurrent) {
                  return (
                    <div
                      className="w-full py-2.5 rounded-xl text-center text-[13.5px] font-semibold bg-panel-2 text-ink-dim shadow-sm"
                    >
                      Current plan
                    </div>
                  );
                }
                if (m.id === "free") {
                  return (
                    <div
                      className="w-full py-2.5 rounded-xl text-center text-[13.5px] font-semibold bg-panel-2 text-ink-dim shadow-sm"
                    >
                      Downgrade not available
                    </div>
                  );
                }
                return (
                  <button
                    type="button"
                    onClick={() => router.push(`/checkout/${m.id}?cycle=${annual ? "annual" : "monthly"}`)}
                    className={`w-full py-2.5 rounded-xl text-[13.5px] font-bold transition-all active:scale-95 ${
                      m.popular
                        ? "bg-[linear-gradient(135deg,var(--teal),#069E9A)] text-white"
                        : "bg-[linear-gradient(135deg,var(--gold),#e09b25)] text-navy-deep"
                    }`}
                  >
                    {m.id === "edge" ? "Upgrade to Edge" : "Join Pro"}
                  </button>
                );
              }}
            />
          );
        })}
      </div>

      {/* Lifetime access */}
      <div className="text-center mb-10">
        <a
          href="mailto:support@smilefxtraders.com"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-bold shadow-sm text-ink-strong hover:bg-hover transition-colors"
        >
          Need lifetime access? Contact our sales team
        </a>
      </div>

      <div
        className="rounded-2xl px-6 py-5 flex items-center gap-4 mb-10 bg-[rgba(8,174,170,0.06)] shadow-[0_0_0_2px_var(--teal)]"
      >
        <Icon name="verified_user" size={30} fill className="text-teal shrink-0" />
        <div>
          <div className="font-display font-semibold text-[15px] mb-0.5 text-ink-strong">
            7-day money-back guarantee
          </div>
          <p className="text-[13px] text-ink-dim">
            Not satisfied in your first 7 days? Email us and we&apos;ll refund you in full, no questions asked.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <FAQAccordion
          title="Frequently asked questions"
          titleClassName="font-display font-bold text-[20px] mb-4 tracking-[-0.02em] text-ink-strong"
          items={FAQ}
        />
      </div>
    </div>
  );
}
