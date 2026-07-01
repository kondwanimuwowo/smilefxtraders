"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import { Icon, Chip } from "@/components/ui";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import { PlanCard } from "@/components/pricing/PlanCard";
import { PLAN_META, DEFAULT_PRICES } from "@/lib/plans";
import type { PlanPrices } from "@/lib/plans";

type PaidPlan = "pro" | "funded";

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
    a: "Yes — all prices are in ZMW (Kwacha). Pay via Airtel Money, MTN MoMo, Zamtel Kwacha, or card." },
  { q: "Can I cancel at any time?",
    a: "Yes. No contracts, no lock-ins. Cancel from your settings and you keep access until the end of your billing period." },
  { q: "What is the Gavo AI Trade Review?",
    a: "After logging a trade, you can request a review from Gavo — our AI trading coach. Gavo grades your trade against the SMC rulebook, giving you a letter grade (A+–D), a verdict, what you did well, and what to improve." },
  { q: "What is the 1-on-1 mentorship?",
    a: "Funded Track members get monthly private video review sessions with Kondwani. He reviews your journal, identifies patterns in your trading, and gives you a personalised improvement plan." },
  { q: "Is there a free trial for Pro?",
    a: "Not currently. The Starter plan is free forever and gives you access to all the tools — you only need to upgrade when you want unlimited journal entries and live alerts." },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b" style={{ borderColor: "var(--line)" }}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center justify-between w-full py-4 text-left gap-4">
        <span className="font-semibold text-[14px]" style={{ color: "var(--ink-strong)" }}>{q}</span>
        <Icon name={open ? "expand_less" : "expand_more"} size={20} style={{ color: "var(--ink-dim)", flexShrink: 0 }} />
      </button>
      {open && <div className="pb-4 text-[13px] leading-relaxed" style={{ color: "var(--ink-mid)" }}>{a}</div>}
    </div>
  );
}

export function Pricing() {
  const { user } = useStore();
  const [annual,        setAnnual]        = useState(false);
  const [checkoutPlan,  setCheckoutPlan]  = useState<PaidPlan | null>(null);
  const [checkoutCycle, setCheckoutCycle] = useState<"monthly" | "annual">("monthly");
  const currentPlan = user?.plan ?? "free";

  const { data: allPrices = DEFAULT_PRICES } = usePlanPrices();

  return (
    <div className="view">
      <div className="text-center mb-8">
        <h1 className="font-display font-bold" style={{ fontSize: 30, letterSpacing: "-0.03em", color: "var(--ink-strong)" }}>
          Simple, transparent pricing
        </h1>
        <p className="text-[15px] mt-2 max-w-lg mx-auto" style={{ color: "var(--ink-dim)" }}>
          Built for Zambian traders. All prices in ZMW (Kwacha).
        </p>
        <div className="flex items-center justify-center gap-3 mt-5">
          <span className="text-[13.5px] font-medium" style={{ color: annual ? "var(--ink-dim)" : "var(--ink-strong)" }}>Monthly</span>
          <button
            type="button"
            onClick={() => setAnnual((a) => !a)}
            className="relative inline-flex h-6 w-11 rounded-full transition-colors"
            style={{ background: annual ? "var(--teal)" : "var(--track)" }}
          >
            <span
              className="inline-block size-5 rounded-full bg-white shadow-sm transition-transform"
              style={{ transform: annual ? "translateX(20px)" : "translateX(2px)", marginTop: 2 }}
            />
          </button>
          <span className="text-[13.5px] font-medium" style={{ color: annual ? "var(--ink-strong)" : "var(--ink-dim)" }}>Annual</span>
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
                      className="w-full py-2.5 rounded-xl text-center text-[13.5px] font-semibold"
                      style={{ background: "var(--panel-2)", color: "var(--ink-dim)", border: "1px solid var(--line)" }}
                    >
                      Current plan
                    </div>
                  );
                }
                if (m.id === "free") {
                  return (
                    <div
                      className="w-full py-2.5 rounded-xl text-center text-[13.5px] font-semibold"
                      style={{ background: "var(--panel-2)", color: "var(--ink-dim)", border: "1px solid var(--line)" }}
                    >
                      Downgrade not available
                    </div>
                  );
                }
                return (
                  <button
                    type="button"
                    onClick={() => { setCheckoutPlan(m.id as PaidPlan); setCheckoutCycle(annual ? "annual" : "monthly"); }}
                    className="w-full py-2.5 rounded-xl text-[13.5px] font-bold transition-all active:scale-95"
                    style={
                      m.popular
                        ? { background: "linear-gradient(135deg, var(--teal), #069E9A)", color: "#fff" }
                        : { background: "linear-gradient(135deg, var(--gold), #e09b25)", color: "var(--navy-deep)" }
                    }
                  >
                    {m.id === "pro" ? "Upgrade to Pro" : "Join Funded Track"}
                  </button>
                );
              }}
            />
          );
        })}
      </div>

      <div
        className="rounded-2xl px-6 py-5 flex items-center gap-4 mb-10"
        style={{ background: "rgba(8,174,170,0.06)", border: "1px solid rgba(8,174,170,0.2)" }}
      >
        <Icon name="verified_user" size={30} fill style={{ color: "var(--teal)", flexShrink: 0 }} />
        <div>
          <div className="font-display font-semibold text-[15px] mb-0.5" style={{ color: "var(--ink-strong)" }}>
            7-day money-back guarantee
          </div>
          <p className="text-[13px]" style={{ color: "var(--ink-dim)" }}>
            Not satisfied in your first 7 days? Email us and we&apos;ll refund you in full — no questions asked.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <h2 className="font-display font-bold text-[20px] mb-4" style={{ color: "var(--ink-strong)", letterSpacing: "-0.02em" }}>
          Frequently asked questions
        </h2>
        {FAQ.map((item) => <FAQItem key={item.q} {...item} />)}
      </div>

      {checkoutPlan && (
        <CheckoutModal
          plan={checkoutPlan}
          cycle={checkoutCycle}
          onClose={() => setCheckoutPlan(null)}
          onSuccess={(p) => console.log("Upgraded to", p)}
        />
      )}
    </div>
  );
}
