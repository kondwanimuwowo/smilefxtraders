"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Icon, Button, Chip } from "@/components/ui";

// ── Plan data ─────────────────────────────────────────────────────────────────

interface Plan {
  id:       "free" | "pro" | "funded";
  name:     string;
  price:    { monthly: number; annual: number };   // USD
  zmw:      { monthly: number; annual: number };   // ZMW Kwacha
  icon:     string;
  color:    string;
  tagline:  string;
  features: { text: string; included: boolean }[];
  cta:      string;
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "free", name: "Starter", icon: "rocket_launch",
    color: "var(--ink-mid)",
    tagline: "Everything you need to start journaling your edge.",
    price: { monthly: 0, annual: 0 },
    zmw:   { monthly: 0, annual: 0 },
    cta: "Current plan",
    features: [
      { text: "Trade journal (up to 20 trades)",        included: true  },
      { text: "Rules Validator",                         included: true  },
      { text: "Trend Matrix",                            included: true  },
      { text: "Economic Calendar",                       included: true  },
      { text: "Community read-only",                     included: true  },
      { text: "Foundations course (free tier)",          included: true  },
      { text: "Unlimited journal trades",                included: false },
      { text: "Live setup alerts from Kondwani",         included: false },
      { text: "Full Academy (all courses)",              included: false },
      { text: "Gavo AI Trade Review",      included: false },
      { text: "COT data integration",                    included: false },
      { text: "Community posting & comments",            included: false },
      { text: "Leaderboard participation",               included: false },
      { text: "1-on-1 mentorship with Kondwani",         included: false },
    ],
  },
  {
    id: "pro", name: "Pro Trader", icon: "trending_up",
    color: "var(--teal)",
    tagline: "The full toolkit for serious SMC traders.",
    price: { monthly: 29, annual: 23 },
    zmw:   { monthly: 750, annual: 600 },
    cta: "Upgrade to Pro",
    popular: true,
    features: [
      { text: "Unlimited trade journal",                 included: true  },
      { text: "Rules Validator",                         included: true  },
      { text: "Trend Matrix",                            included: true  },
      { text: "Economic Calendar (live data)",           included: true  },
      { text: "Community — post, comment, react",        included: true  },
      { text: "Full Academy (all courses + recordings)", included: true  },
      { text: "Live setup alerts from Kondwani",         included: true  },
      { text: "Gavo AI Trade Review",      included: true  },
      { text: "COT Reports",                             included: true  },
      { text: "Leaderboard",                             included: true  },
      { text: "Weekly performance email report",         included: true  },
      { text: "Priority support",                        included: true  },
      { text: "1-on-1 mentorship with Kondwani",         included: false },
    ],
  },
  {
    id: "funded", name: "Funded Track", icon: "workspace_premium",
    color: "var(--gold)",
    tagline: "Everything in Pro, plus personal mentorship toward prop funding.",
    price: { monthly: 79, annual: 63 },
    zmw:   { monthly: 2000, annual: 1600 },
    cta: "Join Funded Track",
    features: [
      { text: "Everything in Pro Trader",                included: true  },
      { text: "1-on-1 mentorship with Kondwani",         included: true  },
      { text: "Monthly private video review session",    included: true  },
      { text: "Personalised 30-day prop firm challenge plan", included: true },
      { text: "Priority alert notifications",            included: true  },
      { text: "Early access to new features",            included: true  },
      { text: "Private Funded Track community channel",  included: true  },
    ],
  },
];

// ── Feature row ───────────────────────────────────────────────────────────────

function FeatureRow({ text, included }: { text: string; included: boolean }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span
        className="material-symbols-rounded shrink-0 mt-0.5"
        style={{ fontSize: 16, color: included ? "var(--teal)" : "var(--track)", fontVariationSettings: "'FILL' 1" }}
      >
        {included ? "check_circle" : "cancel"}
      </span>
      <span
        className="text-[13px] leading-snug"
        style={{ color: included ? "var(--ink-mid)" : "var(--ink-dim)", textDecoration: included ? "none" : "none", opacity: included ? 1 : 0.55 }}
      >
        {text}
      </span>
    </div>
  );
}

// ── Plan card ─────────────────────────────────────────────────────────────────

function PlanCard({
  plan, annual, currentPlan, onUpgrade,
}: {
  plan: Plan; annual: boolean; currentPlan: string; onUpgrade: (id: string) => void;
}) {
  const isCurrent = currentPlan === plan.id;
  const usdPrice  = annual ? plan.price.annual : plan.price.monthly;
  const zmwPrice  = annual ? plan.zmw.annual   : plan.zmw.monthly;

  return (
    <div
      className="rounded-2xl flex flex-col"
      style={{
        background: plan.popular ? `linear-gradient(175deg, rgba(8,174,170,0.07) 0%, transparent 40%), var(--panel)` : "var(--panel)",
        border: plan.popular ? "2px solid rgba(8,174,170,0.4)" : "1px solid var(--line)",
        position: "relative",
        marginTop: plan.popular ? 0 : 14, // non-popular cards pushed down so popular appears elevated
      }}
    >
      {plan.popular && (
        <div
          className="absolute left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
          style={{ background: "var(--teal)", color: "#fff", top: -14 }}
        >
          Most popular
        </div>
      )}

      <div className="px-6 pt-7 pb-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="size-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${plan.color}18` }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 22, color: plan.color, fontVariationSettings: "'FILL' 1" }}>
              {plan.icon}
            </span>
          </div>
          <div>
            <div className="font-display font-bold text-[17px]" style={{ color: "var(--ink-strong)" }}>{plan.name}</div>
          </div>
        </div>

        {/* Price */}
        <div className="mb-2">
          {usdPrice === 0 ? (
            <div className="font-display font-bold text-[34px]" style={{ color: "var(--ink-strong)", letterSpacing: "-0.03em" }}>
              Free
            </div>
          ) : (
            <>
              <div className="flex items-end gap-1.5">
                <span className="font-display font-bold text-[34px]" style={{ color: plan.color, letterSpacing: "-0.03em" }}>
                  ${usdPrice}
                </span>
                <span className="text-[14px] mb-2" style={{ color: "var(--ink-dim)" }}>/mo</span>
              </div>
              <div className="text-[12.5px]" style={{ color: "var(--ink-dim)" }}>
                K{zmwPrice}/mo · {annual ? "billed annually" : "billed monthly"}
              </div>
              {annual && (
                <div className="text-[12px] font-semibold mt-1" style={{ color: "var(--teal)" }}>
                  Save 20% with annual billing
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-[13px] leading-relaxed mb-5" style={{ color: "var(--ink-dim)" }}>
          {plan.tagline}
        </p>

        {/* CTA */}
        {isCurrent ? (
          <div
            className="w-full py-2.5 rounded-xl text-center text-[13.5px] font-semibold"
            style={{ background: "var(--panel-2)", color: "var(--ink-dim)", border: "1px solid var(--line)" }}
          >
            Current plan
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onUpgrade(plan.id)}
            className="w-full py-2.5 rounded-xl text-[13.5px] font-bold transition-all active:scale-95"
            style={
              plan.popular
                ? { background: "linear-gradient(135deg, var(--teal), #069E9A)", color: "#fff", boxShadow: "0 4px 14px rgba(8,174,170,0.3)" }
                : plan.id === "funded"
                  ? { background: "linear-gradient(135deg, var(--gold), #e09b25)", color: "var(--navy-deep)" }
                  : { background: "var(--panel-2)", color: "var(--ink-strong)", border: "1px solid var(--line)" }
            }
          >
            {plan.cta}
          </button>
        )}
      </div>

      {/* Features */}
      <div className="px-6 pb-6 flex-1">
        <div className="pt-4 border-t" style={{ borderColor: "var(--line)" }}>
          {plan.features.map((f) => (
            <FeatureRow key={f.text} text={f.text} included={f.included} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQ = [
  { q: "Can I pay in Kwacha?", a: "Yes — all prices are shown in both USD and ZMW (Kwacha). Payment processing via card or mobile money will be available at launch." },
  { q: "Can I cancel at any time?", a: "Yes. No contracts, no lock-ins. Cancel from your settings and you keep access until the end of your billing period." },
  { q: "What is the Gavo AI Trade Review?", a: "After logging a trade, you can request a review from Gavo — our AI trading coach. Gavo grades your trade against the SMC rulebook, giving you a letter grade (A+–D), a verdict, what you did well, and what to improve." },
  { q: "What is the 1-on-1 mentorship?", a: "Funded Track members get monthly private video review sessions with Kondwani. He reviews your journal, identifies patterns in your trading, and gives you a personalised improvement plan." },
  { q: "Is there a free trial for Pro?", a: "Not currently. The Starter plan is free forever and gives you access to all the tools — you only need to upgrade when you want unlimited journal entries and live alerts." },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b" style={{ borderColor: "var(--line)" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full py-4 text-left gap-4"
      >
        <span className="font-semibold text-[14px]" style={{ color: "var(--ink-strong)" }}>{q}</span>
        <Icon name={open ? "expand_less" : "expand_more"} size={20} style={{ color: "var(--ink-dim)", flexShrink: 0 }} />
      </button>
      {open && (
        <div className="pb-4 text-[13px] leading-relaxed" style={{ color: "var(--ink-mid)" }}>{a}</div>
      )}
    </div>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────

export function Pricing() {
  const { user } = useStore();
  const [annual, setAnnual] = useState(false);
  const plan = user?.plan ?? "free";

  function handleUpgrade(planId: string) {
    if (planId === "free") return;
    window.location.href = `/checkout/${planId}`;
  }

  return (
    <div className="view">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-display font-bold" style={{ fontSize: 30, letterSpacing: "-0.03em", color: "var(--ink-strong)" }}>
          Simple, transparent pricing
        </h1>
        <p className="text-[15px] mt-2 max-w-lg mx-auto" style={{ color: "var(--ink-dim)" }}>
          Built for Zambian traders. Pay in USD or Kwacha.
        </p>

        {/* Billing toggle */}
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
          <span className="text-[13.5px] font-medium" style={{ color: annual ? "var(--ink-strong)" : "var(--ink-dim)" }}>
            Annual
          </span>
          {annual && (
            <Chip tone="teal">Save 20%</Chip>
          )}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12 items-start pt-4">
        {PLANS.map((p) => (
          <PlanCard
            key={p.id}
            plan={p}
            annual={annual}
            currentPlan={plan}
            onUpgrade={handleUpgrade}
          />
        ))}
      </div>

      {/* Money-back guarantee */}
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

      {/* FAQ */}
      <div className="max-w-2xl mx-auto">
        <h2 className="font-display font-bold text-[20px] mb-4" style={{ color: "var(--ink-strong)", letterSpacing: "-0.02em" }}>
          Frequently asked questions
        </h2>
        {FAQ.map((item) => (
          <FAQItem key={item.q} {...item} />
        ))}
      </div>
    </div>
  );
}
