"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ZM_OPERATORS, detectZmOperator, type ZmOperator } from "@/lib/mobile-money";
import { NetworkLogo } from "@/components/checkout/NetworkLogo";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { clearPendingPlan } from "@/lib/pending-plan";

// ── Plan config ───────────────────────────────────────────────────────────────

// Annual billing is quoted at a 20% discount off the monthly rate, but it's
// charged as a single up-front payment covering all 12 months — not the
// discounted monthly figure alone. `monthlyEquivalent` is shown for context;
// `zmw` in the annual price is the real amount charged (monthlyEquivalent * 12).
const PLANS = {
  edge: {
    name:    "Edge",
    icon:    "trending_up",
    color:   "#08AEAA",
    tagline: "Full toolkit for serious SMC traders.",
    features: [
      "Unlimited journal trades",
      "Live setup alerts",
      "Full Academy (all courses)",
      "Gavo AI Trade Review",
      "COT data integration",
      "Community posting & comments",
      "Leaderboard participation",
    ],
    price: {
      monthly: { zmw: 249 },
      annual:  { zmw: 199 * 12, monthlyEquivalent: 199 },
    },
  },
  pro: {
    name:    "Pro",
    icon:    "workspace_premium",
    color:   "#F8B93D",
    tagline: "Everything in Edge + 1-on-1 mentorship.",
    features: [
      "Everything in Edge",
      "1-on-1 mentorship",
      "Priority alert notifications",
      "Private Pro community",
      "Monthly strategy review calls",
    ],
    price: {
      monthly: { zmw: 549 },
      annual:  { zmw: 439 * 12, monthlyEquivalent: 439 },
    },
  },
} as const;

type PlanId  = keyof typeof PLANS;
type Cycle   = "monthly" | "annual";
type PayMethod = "mobile" | "card";
type Step    = "form" | "waiting" | "success" | "failed";

const OPERATORS = ZM_OPERATORS;

// ── Checkout page ─────────────────────────────────────────────────────────────

export function CheckoutPage({ paramsPromise, needsOnboarding }: { paramsPromise: Promise<{ plan: string }>; needsOnboarding: boolean }) {
  const router = useRouter();
  const [planId, setPlanId] = useState<PlanId | null>(null);

  useEffect(() => {
    paramsPromise.then(({ plan }) => {
      if (plan === "edge" || plan === "pro") setPlanId(plan);
      else router.replace("/pricing");
    });
  }, [paramsPromise, router]);

  const [cycle,    setCycle]    = useState<Cycle>("monthly");
  const [phone,    setPhone]    = useState("");
  const [operator, setOperator] = useState<ZmOperator>(OPERATORS[0].value);
  const [autoPicked, setAutoPicked] = useState(false);
  const [step,     setStep]     = useState<Step>("form");
  const [payMethod, setPayMethod] = useState<PayMethod>("mobile");
  const [errMsg,   setErrMsg]   = useState("");
  const [reference, setReference] = useState("");
  const [polling,   setPolling]   = useState(false);
  const [cardLoading, setCardLoading] = useState(false);

  if (!planId) return null;
  const plan = PLANS[planId];
  const price = plan.price[cycle].zmw;
  const symbol = "K";

  function handlePhoneChange(value: string) {
    setPhone(value);
    const detected = detectZmOperator(value);
    if (detected) { setOperator(detected); setAutoPicked(true); }
    else setAutoPicked(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg("");
    setPayMethod("mobile");
    setStep("waiting");

    const res = await fetch("/api/checkout/mobile-money", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId, cycle, phone, operator, currency: "ZMW" }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setErrMsg(data.error ?? "Payment initiation failed. Please try again.");
      setStep("form");
      return;
    }

    setReference(data.reference);
    setStep("waiting");
    startPolling(data.reference);
  }

  async function payWithCard() {
    setErrMsg("");
    setCardLoading(true);

    const res = await fetch("/api/checkout/card", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId, cycle }),
    });
    const data = await res.json().catch(() => ({}));
    setCardLoading(false);

    if (!res.ok || !data.checkoutUrl) {
      setErrMsg(data.error ?? "Could not start card payment. Please try again.");
      return;
    }

    const popup = window.open(data.checkoutUrl, "lenco_card", "width=480,height=720");
    if (!popup) {
      setErrMsg("Please allow popups for this site to pay by card.");
      return;
    }

    setPayMethod("card");
    setReference(data.reference);
    setStep("waiting");
    startPolling(data.reference);
  }

  function startPolling(ref: string) {
    setPolling(true);
    let attempts = 0;
    const max    = 24; // 2 minutes at 5s intervals

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res  = await fetch(`/api/checkout/verify?ref=${encodeURIComponent(ref)}`);
        const data = await res.json().catch(() => ({}));

        if (data.activated) {
          clearInterval(interval);
          setPolling(false);
          setStep("success");
          return;
        }
        if (data.status === "failed") {
          clearInterval(interval);
          setPolling(false);
          setErrMsg("Payment failed. Please try again.");
          setStep("failed");
          return;
        }
      } catch { /* ignore network hiccups during polling */ }

      if (attempts >= max) {
        clearInterval(interval);
        setPolling(false);
        setStep("waiting"); // leave on waiting — webhook may still come
      }
    }, 5000);
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-app-bg">
        <div className="rounded-3xl px-10 py-12 text-center max-w-sm w-full bg-panel border border-line">
          <div className="size-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-[rgba(8,174,170,0.12)] border-2 border-teal">
            <Icon name="check_circle" size={32} className="text-teal" />
          </div>
          <h2 className="font-display font-medium text-[24px] mb-2 tracking-[-0.02em] text-ink-strong">
            You&apos;re on {plan.name}!
          </h2>
          <p className="text-[13.5px] mb-6 text-ink-dim">
            Your payment was confirmed. Full access is now active.
          </p>
          <button
            type="button"
            onClick={() => router.push(needsOnboarding ? "/onboarding" : "/dashboard")}
            className="w-full py-3 rounded-xl font-semibold text-[14px] bg-teal text-white"
          >
            {needsOnboarding ? "Continue setup" : "Go to Dashboard"}
          </button>
        </div>
      </div>
    );
  }

  if (step === "waiting" || step === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-app-bg">
        <div className="rounded-3xl px-10 py-12 text-center max-w-sm w-full bg-panel border border-line">
          {step === "waiting" ? (
            <>
              <div className="size-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-[rgba(248,185,61,0.12)] border-2 border-gold">
                <Icon name={payMethod === "card" ? "credit_card" : "phone_android"} size={32} className="animate-pulse text-gold" />
              </div>
              <h2 className="font-display font-medium text-[22px] mb-2 tracking-[-0.02em] text-ink-strong">
                {payMethod === "card" ? "Complete your card payment" : "Check your phone"}
              </h2>
              <p className="text-[13.5px] mb-3 text-ink-dim">
                {payMethod === "card"
                  ? "Finish entering your card details in the popup window to activate your plan."
                  : <>A USSD prompt has been sent to <strong className="text-ink-strong">{phone}</strong>. Approve the payment to activate your plan.</>}
              </p>
              <p className="text-[12px] mb-6 text-ink-dim">
                {polling ? "Waiting for confirmation…" : "Your plan will activate automatically once payment is confirmed."}
              </p>
              <button
                type="button"
                onClick={() => { setStep("form"); setErrMsg(""); }}
                className="text-[12.5px] font-medium text-ink-dim"
              >
                ← Change payment details
              </button>
            </>
          ) : (
            <>
              <div className="size-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-[rgba(234,82,61,0.12)] border-2 border-coral">
                <Icon name="error" size={32} className="text-coral" />
              </div>
              <h2 className="font-display font-medium text-[22px] mb-2 tracking-[-0.02em] text-ink-strong">Payment failed</h2>
              <p className="text-[13.5px] mb-6 text-ink-dim">{errMsg}</p>
              <button
                type="button"
                onClick={() => { setStep("form"); setErrMsg(""); }}
                className="w-full py-3 rounded-xl font-semibold text-[14px] bg-panel-2 border border-line text-ink-strong"
              >
                Try again
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-app-bg">
      <div className="w-full max-w-5xl">

        {/* Back link */}
        <button type="button" onClick={() => router.push("/pricing")}
          className="flex items-center gap-1.5 text-[12.5px] mb-5 text-ink-dim"
        >
          <Icon name="arrow_back" size={16} />
          Back to Pricing
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-6 items-start">

          {/* ── Left: plan summary + order total + trust strip ── */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl p-6 bg-panel" style={{ border: `1px solid ${plan.color}40` }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="size-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${plan.color}20`, border: `1px solid ${plan.color}40` }}
                >
                  <Icon name={plan.icon} size={22} style={{ color: plan.color }} />
                </div>
                <div>
                  <div className="font-display font-bold text-[19px] tracking-[-0.02em] text-ink-strong">{plan.name}</div>
                  <div className="text-[12.5px] text-ink-dim">{plan.tagline}</div>
                </div>
              </div>
              <ul className="space-y-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[13px] text-ink-mid">
                    <Icon name="check_circle" size={15} className="text-teal shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Order summary */}
              <div className="pt-4 border-t border-line">
                <div className="flex items-center justify-between text-[13px] text-ink-dim mb-1.5">
                  <span>{plan.name} plan</span>
                  <span className="capitalize">{cycle} billing</span>
                </div>
                {cycle === "annual" && (
                  <div className="flex items-center justify-between text-[13px] text-ink-dim mb-1.5">
                    <span>{symbol}{plan.price.annual.monthlyEquivalent.toLocaleString()}/mo &times; 12 months</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 mt-1 border-t border-line">
                  <span className="font-semibold text-[13.5px] text-ink-strong">Total due today</span>
                  <span className="font-display font-bold tabular-nums text-[19px] tracking-[-0.02em]" style={{ color: plan.color }}>
                    {symbol}{price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Trust strip */}
            <div className="rounded-2xl p-5 bg-panel border border-line flex flex-col gap-3">
              <div className="flex items-center gap-2.5 text-[13px] text-ink-mid">
                <Icon name="lock" size={16} className="text-teal shrink-0" />
                Payments are processed securely by Lenco &mdash; we never see or store your card or mobile money details.
              </div>
              <div className="flex items-center gap-2.5 text-[13px] text-ink-mid">
                <Icon name="verified_user" size={16} className="text-teal shrink-0" />
                Encrypted end-to-end. Cancel or change your plan anytime from Settings.
              </div>
            </div>
          </div>

          {/* ── Right: payment form ── */}
          <div className="flex flex-col gap-4">

            {/* Continue with Free account instead — sits above payment details, visible not buried */}
            {needsOnboarding && (
              <button
                type="button"
                onClick={() => { clearPendingPlan(); router.push("/onboarding"); }}
                className="w-full text-center text-[13.5px] font-semibold py-3 rounded-xl border border-line bg-panel-2 text-ink-strong hover:bg-hover transition-colors"
              >
                Continue with Free account instead
              </button>
            )}

            <div className="rounded-2xl p-5 bg-panel border border-line">
              <h2 className="font-display font-medium text-[18px] mb-4 tracking-[-0.02em] text-ink-strong">
                Payment details
              </h2>

              {/* Billing cycle */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold uppercase tracking-wide mb-2 text-ink-dim">Billing cycle</label>
            <div className="flex rounded-xl overflow-hidden border border-line">
              {(["monthly", "annual"] as const).map((c) => (
                <button key={c} type="button" onClick={() => setCycle(c)}
                  className={`flex-1 py-2.5 text-[13px] font-semibold capitalize transition-all ${
                    cycle === c ? "bg-teal text-white" : "bg-panel-2 text-ink-mid"
                  }`}
                >
                  {c} {c === "annual" && <span className="text-[11px] opacity-75">−20%</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Amount display */}
          <div className="flex flex-col items-center justify-center mb-4 py-3 rounded-xl bg-panel-2 border border-line">
            <div className="flex items-center">
              <span className="font-display font-bold tabular-nums text-[32px] tracking-[-0.03em]" style={{ color: plan.color }}>
                {symbol}{price.toLocaleString()}
              </span>
              <span className="text-[13px] ml-2 mt-1 text-ink-dim">/{cycle === "annual" ? "yr" : "mo"}</span>
            </div>
            {cycle === "annual" && (
              <span className="text-[11.5px] mt-1 text-ink-dim">
                {symbol}{plan.price.annual.monthlyEquivalent.toLocaleString()}/mo billed annually
              </span>
            )}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Phone */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5 text-ink-dim">Phone number (mobile money)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="+260 97 123 4567"
                required
                className="w-full px-4 py-3 rounded-xl text-[14px] bg-panel-2 border border-line text-ink-strong"
              />
            </div>

            {/* Operator */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide mb-1.5 text-ink-dim">
                Mobile money operator
                {autoPicked && (
                  <span className="text-[9.5px] font-bold normal-case px-1.5 py-0.5 rounded-full bg-[rgba(8,174,170,0.1)] text-teal border border-[rgba(8,174,170,0.2)]">
                    auto-detected
                  </span>
                )}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {OPERATORS.map((op) => {
                  const active = operator === op.value;
                  return (
                    <button
                      key={op.value}
                      type="button"
                      onClick={() => { setOperator(op.value); setAutoPicked(false); }}
                      className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 transition-all border ${
                        active
                          ? "bg-[rgba(8,174,170,0.07)] border-teal shadow-[inset_0_0_0_1px_rgba(8,174,170,0.25)]"
                          : "bg-panel-2 border-line"
                      }`}
                    >
                      <NetworkLogo op={op.value} size={30} />
                      <span className={`text-[11px] font-semibold leading-tight text-center ${active ? "text-ink-strong" : "text-ink-dim"}`}>
                        {op.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={cardLoading}
                onClick={payWithCard}
                className={cn(
                  "w-full mt-2.5 py-3 rounded-xl text-[13.5px] font-semibold flex items-center justify-center gap-2 bg-panel-2 border border-line text-ink-strong transition-opacity",
                  cardLoading && "opacity-70"
                )}
              >
                <Icon name="credit_card" size={16} />
                {cardLoading ? "Opening secure payment…" : "Pay with Visa/Mastercard/etc."}
              </button>
            </div>

            {errMsg && (
              <p className="text-[12.5px] px-3 py-2 rounded-xl bg-[rgba(234,82,61,0.08)] text-coral border border-[rgba(234,82,61,0.2)]">
                {errMsg}
              </p>
            )}

            <button
              type="submit"
              className={cn(
                "w-full py-3.5 rounded-xl font-semibold text-[14px] transition-all active:scale-98",
                planId === "pro" ? "text-[var(--navy-deep)]" : "text-white"
              )}
              style={{ background: plan.color }}
            >
              Pay {symbol}{price.toLocaleString()} · Activate {plan.name}
            </button>

            <p className="text-[11.5px] text-center text-ink-dim">
              You will receive a USSD prompt on your phone to confirm the payment.
            </p>
          </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
