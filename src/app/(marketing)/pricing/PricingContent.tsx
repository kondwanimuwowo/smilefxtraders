"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { MarketingPlanCard } from "@/components/pricing/MarketingPlanCard";
import { PLAN_META } from "@/lib/plans";
import type { PlanPrices } from "@/lib/plans";

const FAQ_ITEMS = [
  { q: "Can I pay in Kwacha?", a: "Yes, all prices have a ZMW equivalent. Payments are processed via Airtel Money, MTN MoMo, Zamtel Kwacha, or card." },
  { q: "Is there a free trial for Pro?", a: "Not currently. The Starter plan is free forever and gives you access to all the core tools. Upgrade when the limits become a constraint." },
  { q: "What frameworks does the platform support?", a: "SMC (Smart Money Concepts) and Supply & Demand. You choose your framework during onboarding, and all tools (the validator, alerts, and journal) reflect your choice." },
  { q: "Can I cancel at any time?", a: "Yes. No contracts, no lock-ins. Cancel from your account settings and you keep access until the end of your billing period." },
  { q: "What is the 1-on-1 mentorship?", a: "Funded Track members get monthly private sessions with Kondwani. He reviews your journal, identifies patterns, and gives you a personalised improvement plan." },
  { q: "Do annual plans cost less?", a: "Yes, annual billing saves 20% on all paid plans." },
];

interface Props {
  prices: PlanPrices[];
}

export function PricingContent({ prices }: Props) {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* Dark hero */}
      <section className="dark py-32 pb-16 bg-[radial-gradient(ellipse_at_12%_18%,rgba(8,174,170,0.45)_0%,transparent_52%),radial-gradient(ellipse_at_88%_88%,rgba(248,185,61,0.32)_0%,transparent_48%),linear-gradient(155deg,#0C4E6B_0%,#082A3B_60%)]">
        <div className="container">
          <div className="sec-head center reveal">
            <h2 className="m-0 font-extrabold tracking-[-0.01em] leading-[1.18] text-[clamp(28px,3.8vw,46px)]">Simple, transparent pricing</h2>
            <p className="lead mt-[18px]">Start free. Upgrade when the limits become a constraint.</p>
          </div>
          {/* Billing toggle */}
          <div className="reveal flex justify-center mt-[30px]">
            <div className="toggle-wrap">
              <button
                onClick={() => setAnnual(false)}
                className={`border-none py-[9px] px-5 rounded-full font-sans font-semibold text-sm cursor-pointer transition-all duration-200 ${!annual ? "bg-teal text-white" : "bg-transparent text-white/70"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`border-none py-[9px] px-5 rounded-full font-sans font-semibold text-sm cursor-pointer transition-all duration-200 ${annual ? "bg-teal text-white" : "bg-transparent text-white/70"}`}
              >
                Annual <span className={annual ? "text-white" : "text-gold"}>−20%</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Plan cards */}
      <section className="section pt-0">
        <div className="container">
          <div className="reveal price-grid -mt-6">
            {PLAN_META.map((meta) => (
              <MarketingPlanCard
                key={meta.id}
                meta={meta}
                prices={prices.find((x) => x.planId === meta.id)!}
                annual={annual}
              />
            ))}
          </div>

          {/* Money-back */}
          <div className="reveal flex items-center gap-4 mt-10 mx-auto max-w-[640px] py-5 px-6 bg-[rgba(8,174,170,0.06)] border border-[rgba(8,174,170,0.2)] rounded-[18px]">
            <span className="material-symbols-rounded ic-fill text-teal text-[28px] shrink-0">verified_user</span>
            <div>
              <div className="font-bold text-[15px] text-ink-strong">7-day money-back guarantee</div>
              <p className="text-[13px] text-ink-dim mt-1">Not satisfied in your first 7 days? Email us and we&apos;ll refund in full, no questions asked.</p>
            </div>
          </div>
          <p className="reveal text-center text-[12.5px] text-ink-dim mt-5">
            All prices in ZMW (Kwacha). Annual billing saves 20%.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section soft">
        <div className="container max-w-[820px]">
          <div className="sec-head center reveal mb-2">
            <div className="eyebrow">Questions</div>
            <h2>Good to know</h2>
            <div className="rule mt-5 mx-auto" />
          </div>
          <div className="reveal mt-8">
            {FAQ_ITEMS.map(({ q, a }, i) => (
              <div key={q} className="border-b border-line">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left bg-transparent border-none py-5 flex items-center justify-between gap-4 cursor-pointer font-display text-[17px] font-semibold text-ink"
                >
                  {q}
                  <span className={`material-symbols-rounded text-teal shrink-0 transition-transform duration-[250ms] ${openFaq === i ? "rotate-45" : "rotate-0"}`}>add</span>
                </button>
                <div className="overflow-hidden transition-[max-height] duration-300 ease-app" style={{ maxHeight: openFaq === i ? 200 : 0 }}>
                  <p className="pb-5 text-[14.5px] text-ink-mid leading-[1.65]">{a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <div className="reveal text-center max-w-[560px] mx-auto">
            <h2 className="text-[clamp(26px,3.6vw,38px)]">Start free, upgrade when it pays off</h2>
            <p className="lead mt-3">No card required to begin. Build the habit first.</p>
            <div className="mt-6">
              <Button href="/signup" size="lg" iconRight="arrow_forward">Create your free account</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
