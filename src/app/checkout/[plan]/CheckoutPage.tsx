"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ZM_OPERATORS, detectZmOperator, type ZmOperator } from "@/lib/mobile-money";
import { NetworkLogo } from "@/components/checkout/NetworkLogo";
import { cn } from "@/lib/cn";

// ── Plan config ───────────────────────────────────────────────────────────────

const PLANS = {
  pro: {
    name:    "Pro Trader",
    icon:    "trending_up",
    color:   "#08AEAA",
    tagline: "Full toolkit for serious SMC traders.",
    features: [
      "Unlimited journal trades",
      "Live setup alerts from Kondwani",
      "Full Academy (all courses)",
      "Gavo AI Trade Review",
      "COT data integration",
      "Community posting & comments",
      "Leaderboard participation",
    ],
    price: { monthly: { usd: 20, zmw: 299 }, annual: { usd: 16, zmw: 239 } },
  },
  funded: {
    name:    "Funded Track",
    icon:    "workspace_premium",
    color:   "#F8B93D",
    tagline: "Everything in Pro + 1-on-1 mentorship.",
    features: [
      "Everything in Pro Trader",
      "1-on-1 mentorship with Kondwani",
      "Priority alert notifications",
      "Private Funded Track community",
      "Monthly strategy review calls",
    ],
    price: { monthly: { usd: 40, zmw: 599 }, annual: { usd: 32, zmw: 479 } },
  },
} as const;

type PlanId  = keyof typeof PLANS;
type Cycle   = "monthly" | "annual";
type Currency = "ZMW" | "USD";
type Step    = "form" | "waiting" | "success" | "failed";

const OPERATORS = ZM_OPERATORS;

// ── Checkout page ─────────────────────────────────────────────────────────────

export function CheckoutPage({ paramsPromise }: { paramsPromise: Promise<{ plan: string }> }) {
  const router = useRouter();
  const [planId, setPlanId] = useState<PlanId | null>(null);

  useEffect(() => {
    paramsPromise.then(({ plan }) => {
      if (plan === "pro" || plan === "funded") setPlanId(plan);
      else router.replace("/pricing");
    });
  }, [paramsPromise, router]);

  const [cycle,    setCycle]    = useState<Cycle>("monthly");
  const [currency, setCurrency] = useState<Currency>("ZMW");
  const [phone,    setPhone]    = useState("");
  const [operator, setOperator] = useState<ZmOperator>(OPERATORS[0].value);
  const [autoPicked, setAutoPicked] = useState(false);
  const [step,     setStep]     = useState<Step>("form");
  const [errMsg,   setErrMsg]   = useState("");
  const [reference, setReference] = useState("");
  const [polling,   setPolling]   = useState(false);

  if (!planId) return null;
  const plan = PLANS[planId];
  const price = plan.price[cycle][currency === "ZMW" ? "zmw" : "usd"];
  const symbol = currency === "ZMW" ? "K" : "$";

  function handlePhoneChange(value: string) {
    setPhone(value);
    const detected = detectZmOperator(value);
    if (detected) { setOperator(detected); setAutoPicked(true); }
    else setAutoPicked(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg("");
    setStep("waiting");

    const res = await fetch("/api/checkout/mobile-money", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId, cycle, phone, operator, currency }),
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
            <span className="material-symbols-rounded ic-fill text-[32px] text-teal">check_circle</span>
          </div>
          <h2 className="font-display font-bold text-[24px] mb-2 tracking-[-0.02em] text-ink-strong">
            You&apos;re on {plan.name}!
          </h2>
          <p className="text-[13.5px] mb-6 text-ink-dim">
            Your payment was confirmed. Full access is now active.
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="w-full py-3 rounded-xl font-semibold text-[14px] bg-teal text-white"
          >
            Go to Dashboard
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
                <span className="material-symbols-rounded ic-fill text-[32px] animate-pulse text-gold">phone_android</span>
              </div>
              <h2 className="font-display font-bold text-[22px] mb-2 tracking-[-0.02em] text-ink-strong">
                Check your phone
              </h2>
              <p className="text-[13.5px] mb-3 text-ink-dim">
                A USSD prompt has been sent to <strong className="text-ink-strong">{phone}</strong>. Approve the payment to activate your plan.
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
                <span className="material-symbols-rounded ic-fill text-[32px] text-coral">error</span>
              </div>
              <h2 className="font-display font-bold text-[22px] mb-2 tracking-[-0.02em] text-ink-strong">Payment failed</h2>
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
      <div className="w-full max-w-md">

        {/* Back link */}
        <button type="button" onClick={() => router.push("/pricing")}
          className="flex items-center gap-1.5 text-[12.5px] mb-5 text-ink-dim"
        >
          <span className="material-symbols-rounded text-[16px]">arrow_back</span>
          Back to Pricing
        </button>

        {/* Plan summary card */}
        <div className="rounded-2xl p-5 mb-4 bg-panel" style={{ border: `1px solid ${plan.color}40` }}>
          <div className="flex items-start gap-3 mb-3">
            <div className="size-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${plan.color}20`, border: `1px solid ${plan.color}40` }}
            >
              <span className="material-symbols-rounded ic-fill text-xl" style={{ color: plan.color }}>
                {plan.icon}
              </span>
            </div>
            <div>
              <div className="font-display font-bold text-[18px] tracking-[-0.02em] text-ink-strong">{plan.name}</div>
              <div className="text-[12.5px] text-ink-dim">{plan.tagline}</div>
            </div>
          </div>
          <ul className="space-y-1.5">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-[12.5px] text-ink-mid">
                <span className="material-symbols-rounded ic-fill text-[14px] text-teal">check_circle</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Payment form */}
        <div className="rounded-2xl p-5 bg-panel border border-line">
          <h2 className="font-display font-bold text-[18px] mb-4 tracking-[-0.02em] text-ink-strong">
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

          {/* Currency */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold uppercase tracking-wide mb-2 text-ink-dim">Currency</label>
            <div className="flex rounded-xl overflow-hidden border border-line">
              {(["ZMW", "USD"] as const).map((c) => (
                <button key={c} type="button" onClick={() => setCurrency(c)}
                  className={`flex-1 py-2.5 text-[13px] font-semibold transition-all ${
                    currency === c ? "bg-navy text-white" : "bg-panel-2 text-ink-mid"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Amount display */}
          <div className="flex items-center justify-center mb-4 py-3 rounded-xl bg-panel-2 border border-line">
            <span className="font-display font-bold tabular-nums text-[32px] tracking-[-0.03em]" style={{ color: plan.color }}>
              {symbol}{price.toLocaleString()}
            </span>
            <span className="text-[13px] ml-2 mt-1 text-ink-dim">/{cycle === "annual" ? "yr" : "mo"}</span>
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
                planId === "funded" ? "text-[var(--navy-deep)]" : "text-white"
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
  );
}
