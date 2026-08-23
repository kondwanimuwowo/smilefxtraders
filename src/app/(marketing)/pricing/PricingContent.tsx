"use client";

import { useState } from "react";
import { Button, Icon } from "@/components/ui";
import { MarketingPlanCard } from "@/components/pricing/MarketingPlanCard";
import { FAQAccordion } from "@/components/marketing/FAQAccordion";
import { PLAN_META } from "@/lib/plans";
import { PRICING_FAQ } from "@/lib/pricing-faq";
import type { PlanPrices } from "@/lib/plans";


interface Props {
  prices: PlanPrices[];
}

export function PricingContent({ prices }: Props) {
  const [annual, setAnnual] = useState(false);

  return (
    <>
      {/* Dark hero */}
      <section className="dark py-32 pb-16 bg-[radial-gradient(ellipse_at_12%_18%,rgba(8,174,170,0.45)_0%,transparent_52%),radial-gradient(ellipse_at_88%_88%,rgba(248,185,61,0.32)_0%,transparent_48%),linear-gradient(155deg,#0C4E6B_0%,#082A3B_60%)]">
        <div className="container">
          <div className="sec-head center reveal">
            <h1 className="m-0 font-extrabold tracking-[-0.01em] leading-[1.18] text-[clamp(28px,3.8vw,46px)]">Simple, transparent pricing</h1>
            <p className="lead mt-[18px]">Start free. Upgrade when the limits become a constraint.</p>
          </div>
          {/* Billing toggle */}
          <div className="reveal flex justify-center mt-[30px]">
            <div className="toggle-wrap">
              <button
                onClick={() => setAnnual(false)}
                className={`border-none py-[9px] px-5 rounded-full font-sans font-semibold text-sm cursor-pointer transition-all duration-200 ${!annual ? "bg-teal-solid text-white" : "bg-transparent text-ink-mid hover:text-ink-strong"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`border-none py-[9px] px-5 rounded-full font-sans font-semibold text-sm cursor-pointer transition-all duration-200 ${annual ? "bg-teal-solid text-white" : "bg-transparent text-ink-mid hover:text-ink-strong"}`}
              >
                Annual <span className={annual ? "text-white" : "text-gold-deep"}>−20%</span>
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

          {/* Lifetime access */}
          <div className="reveal text-center mt-8">
            <Button href="mailto:support@smilefxtraders.com" hardNav size="lg" variant="ghost">
              Need lifetime access? Contact our sales team
            </Button>
          </div>

          {/* Money-back */}
          <div className="reveal flex items-center gap-4 mt-10 mx-auto max-w-[640px] py-5 px-6 bg-teal-tint-soft shadow-ring-teal rounded-[18px]">
            <Icon name="verified_user" size={28} className="text-icon shrink-0" />
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
            <FAQAccordion title="Good to know" items={PRICING_FAQ} />
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
              <Button href="/signup" hardNav size="lg" iconRight="arrow_forward">Create your free account</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
