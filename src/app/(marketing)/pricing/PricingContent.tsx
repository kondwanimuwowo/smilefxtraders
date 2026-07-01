"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { MarketingPlanCard } from "@/components/pricing/MarketingPlanCard";
import { PLAN_META } from "@/lib/plans";
import type { PlanPrices } from "@/lib/plans";

const FAQ_ITEMS = [
  { q: "Can I pay in Kwacha?", a: "Yes — all prices have a ZMW equivalent. Payments are processed via Airtel Money, MTN MoMo, Zamtel Kwacha, or card." },
  { q: "Is there a free trial for Pro?", a: "Not currently. The Starter plan is free forever and gives you access to all the core tools. Upgrade when the limits become a constraint." },
  { q: "What frameworks does the platform support?", a: "SMC (Smart Money Concepts) and Supply & Demand. You choose your framework during onboarding and all tools — the validator, alerts, and journal — reflect your choice." },
  { q: "Can I cancel at any time?", a: "Yes. No contracts, no lock-ins. Cancel from your account settings and you keep access until the end of your billing period." },
  { q: "What is the 1-on-1 mentorship?", a: "Funded Track members get monthly private sessions with Kondwani. He reviews your journal, identifies patterns, and gives you a personalised improvement plan." },
  { q: "Do annual plans cost less?", a: "Yes — annual billing saves 20% on all paid plans." },
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
      <section className="dark" style={{ padding: "128px 0 64px", background: "radial-gradient(ellipse at 12% 18%, rgba(8,174,170,0.45) 0%, transparent 52%), radial-gradient(ellipse at 88% 88%, rgba(248,185,61,0.32) 0%, transparent 48%), linear-gradient(155deg, #0C4E6B 0%, #082A3B 60%)" }}>
        <div className="container">
          <div className="sec-head center reveal">
            <h2 style={{ fontSize: "clamp(28px,3.8vw,46px)", fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.18, margin: 0 }}>Simple, transparent pricing</h2>
            <p className="lead" style={{ marginTop: 18 }}>Start free. Upgrade when the limits become a constraint.</p>
          </div>
          {/* Billing toggle */}
          <div className="reveal" style={{ display: "flex", justifyContent: "center", marginTop: 30 }}>
            <div className="toggle-wrap">
              <button
                onClick={() => setAnnual(false)}
                style={{ border: "none", background: !annual ? "var(--teal)" : "transparent", color: !annual ? "#fff" : "rgba(255,255,255,0.7)", padding: "9px 20px", borderRadius: 99, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.2s" }}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                style={{ border: "none", background: annual ? "var(--teal)" : "transparent", color: annual ? "#fff" : "rgba(255,255,255,0.7)", padding: "9px 20px", borderRadius: 99, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.2s" }}
              >
                Annual <span style={{ color: annual ? "#fff" : "var(--gold)" }}>−20%</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Plan cards */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div
            className="reveal"
            style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, alignItems: "start", marginTop: -24 }}
          >
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
          <div className="reveal" style={{ display: "flex", alignItems: "center", gap: 16, margin: "40px auto 0", maxWidth: 640, padding: "20px 24px", background: "rgba(8,174,170,0.06)", border: "1px solid rgba(8,174,170,0.2)", borderRadius: 18 }}>
            <span className="material-symbols-rounded ic-fill" style={{ color: "var(--teal)", fontSize: 28, flexShrink: 0 }}>verified_user</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink-strong)" }}>7-day money-back guarantee</div>
              <p style={{ fontSize: 13, color: "var(--ink-dim)", marginTop: 3 }}>Not satisfied in your first 7 days? Email us and we&apos;ll refund in full — no questions asked.</p>
            </div>
          </div>
          <p className="reveal" style={{ textAlign: "center", fontSize: 12.5, color: "var(--ink-dim)", marginTop: 20 }}>
            All prices in ZMW (Kwacha). Annual billing saves 20%.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section soft">
        <div className="container" style={{ maxWidth: 820 }}>
          <div className="sec-head center reveal" style={{ marginBottom: 8 }}>
            <div className="eyebrow">Questions</div>
            <h2>Good to know</h2>
            <div className="rule" style={{ margin: "20px auto 0" }} />
          </div>
          <div className="reveal" style={{ marginTop: 32 }}>
            {FAQ_ITEMS.map(({ q, a }, i) => (
              <div key={q} style={{ borderBottom: "1px solid var(--line)" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "20px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, cursor: "pointer", fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, color: "var(--ink)" }}
                >
                  {q}
                  <span className="material-symbols-rounded" style={{ transition: "transform 0.25s", transform: openFaq === i ? "rotate(45deg)" : "none", color: "var(--teal)", flexShrink: 0 }}>add</span>
                </button>
                <div style={{ maxHeight: openFaq === i ? 200 : 0, overflow: "hidden", transition: "max-height 0.3s cubic-bezier(0.16,1,0.3,1)" }}>
                  <p style={{ paddingBottom: 20, fontSize: 14.5, color: "var(--ink-mid)", lineHeight: 1.65 }}>{a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <div className="reveal" style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(26px,3.6vw,38px)" }}>Start free — upgrade when it pays off</h2>
            <p className="lead" style={{ marginTop: 12 }}>No card required to begin. Build the habit first.</p>
            <div style={{ marginTop: 24 }}>
              <Button href="/signup" size="lg" iconRight="arrow_forward">Create your free account</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
