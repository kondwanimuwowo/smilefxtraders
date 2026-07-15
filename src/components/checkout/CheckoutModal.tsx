"use client";

import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { ZM_OPERATORS, detectZmOperator, type ZmOperator } from "@/lib/mobile-money";
import { NetworkLogo } from "./NetworkLogo";
import { Icon } from "@/components/ui";

// ── Types ─────────────────────────────────────────────────────────────────────

type PaidPlan  = "edge" | "pro";
type BillingCy = "monthly" | "annual";
type Method    = "mobile" | "card";
type Screen    = "method" | "waiting" | "success";

const PLAN_PRICES: Record<PaidPlan, { monthly: number; annual: number; name: string }> = {
  edge: { monthly: 249, annual: 199, name: "Edge" },
  pro:  { monthly: 549, annual: 439, name: "Pro"  },
};

const OPERATORS = ZM_OPERATORS;

const POLL_INTERVAL = 5000; // 5 s
const POLL_MAX      = 12;   // 60 s total

// ── Modal ─────────────────────────────────────────────────────────────────────

export function CheckoutModal({
  plan, cycle, onClose, onSuccess,
}: {
  plan:      PaidPlan;
  cycle:     BillingCy;
  onClose:   () => void;
  onSuccess: (newPlan: PaidPlan) => void;
}) {
  const { user, setUser } = useStore();

  const [screen,   setScreen]   = useState<Screen>("method");
  const [method,   setMethod]   = useState<Method>("mobile");
  const [phone,    setPhone]    = useState("");
  const [operator, setOperator] = useState<ZmOperator>("airtel");
  const [autoPicked, setAutoPicked] = useState(false); // operator set by number detection
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [ref,      setRef]      = useState("");
  const [polls,    setPolls]    = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const planCfg = PLAN_PRICES[plan];
  const price   = cycle === "annual" ? planCfg.annual : planCfg.monthly;

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // ── Polling ───────────────────────────────────────────────────────────────

  function startPolling(reference: string) {
    setPolls(0);
    pollRef.current = setInterval(async () => {
      setPolls((p) => {
        if (p >= POLL_MAX) {
          clearInterval(pollRef.current!);
          setTimedOut(true);
          return p;
        }
        return p + 1;
      });

      const res = await fetch(`/api/checkout/verify?ref=${reference}`).catch(() => null);
      if (!res) return;
      const data = await res.json().catch(() => null) as { activated?: boolean; status?: string } | null;
      if (data?.activated) {
        clearInterval(pollRef.current!);
        handleActivated();
      } else if (data?.status === "failed" || data?.status === "declined") {
        // Payment terminated — stop polling and send the user back to retry.
        clearInterval(pollRef.current!);
        setScreen("method");
        setError("Payment was not completed. Please try again or use a different network.");
      }
    }, POLL_INTERVAL);
  }

  function handleActivated() {
    if (user) setUser({ ...user, plan });
    setScreen("success");
    setTimeout(() => { onSuccess(plan); onClose(); }, 2200);
  }

  // ── Phone input → auto-detect the mobile-money network ────────────────────

  function handlePhoneChange(value: string) {
    setPhone(value);
    const detected = detectZmOperator(value);
    if (detected) {
      setOperator(detected);
      setAutoPicked(true);
    } else {
      setAutoPicked(false);
    }
  }

  // ── Mobile money submit ───────────────────────────────────────────────────

  async function submitMobileMoney() {
    if (!phone.trim()) { setError("Please enter your mobile number."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/mobile-money", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ plan, cycle, phone: phone.trim(), operator, currency: "ZMW" }),
      });
      const data = await res.json() as { reference?: string; error?: string };
      if (!res.ok || !data.reference) {
        setError(data.error ?? "Payment initiation failed. Please try again.");
        setLoading(false);
        return;
      }
      setRef(data.reference);
      setScreen("waiting");
      startPolling(data.reference);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  // ── Manual verify ─────────────────────────────────────────────────────────

  async function manualVerify() {
    if (!ref) return;
    setTimedOut(false);
    const res = await fetch(`/api/checkout/verify?ref=${ref}`).catch(() => null);
    if (!res) { setError("Verification failed. Try again."); return; }
    const data = await res.json().catch(() => null) as { activated?: boolean } | null;
    if (data?.activated) {
      handleActivated();
    } else {
      setError("Payment not confirmed yet. Approve the prompt on your phone, then try again.");
      setTimedOut(true);
    }
  }

  // ── Card payment ──────────────────────────────────────────────────────────

  function openCardPage() {
    // Lenco hosted card page — opened in a new tab
    const params = new URLSearchParams({ plan, cycle, currency: "ZMW" });
    window.open(`/api/checkout/card?${params.toString()}`, "_blank");
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(0,0,0,0.55)] backdrop-blur-[4px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden bg-panel border border-line shadow-[0_10px_26px_rgba(0,0,0,0.38)] animate-[popIn_180ms_cubic-bezier(0.16,1,0.3,1)]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div>
            <div className="font-display font-bold text-[16px] text-ink-strong">
              {screen === "success" ? "Payment confirmed!" : `Upgrade to ${planCfg.name}`}
            </div>
            {screen !== "success" && (
              <div className="text-[12.5px] mt-0.5 text-ink-dim">
                K{price}/mo · {cycle === "annual" ? "billed annually" : "billed monthly"} · ZMW
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-lg hover:opacity-70 transition-opacity text-ink-dim"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* ── Screen: method ── */}
          {screen === "method" && (
            <div className="flex flex-col gap-4">
              {/* Method tabs */}
              <div className="flex rounded-xl overflow-hidden border border-line">
                {(["mobile", "card"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`flex-1 py-2.5 text-[13px] font-semibold transition-all ${
                      method === m ? "bg-teal text-white" : "bg-panel-2 text-ink-mid"
                    } ${m === "mobile" ? "border-r border-line" : ""}`}
                  >
                    {m === "mobile" ? "Mobile Money" : "Card"}
                  </button>
                ))}
              </div>

              {method === "mobile" ? (
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-semibold text-ink-mid">Mobile number</span>
                    <input
                      type="tel"
                      placeholder="09XXXXXXXX"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="rounded-xl px-3 py-2.5 text-[14px] outline-none bg-panel-2 border border-line text-ink-strong"
                    />
                  </label>

                  <div className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-mid">
                      Mobile money provider
                      {autoPicked && (
                        <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full bg-[rgba(8,174,170,0.1)] text-teal border border-[rgba(8,174,170,0.2)]">
                          auto-detected
                        </span>
                      )}
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {OPERATORS.map((o) => {
                        const active = operator === o.value;
                        return (
                          <button
                            key={o.value}
                            type="button"
                            onClick={() => { setOperator(o.value); setAutoPicked(false); }}
                            className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 transition-all border ${
                              active
                                ? "bg-[rgba(8,174,170,0.07)] border-teal shadow-[inset_0_0_0_1px_rgba(8,174,170,0.25)]"
                                : "bg-panel-2 border-line"
                            }`}
                          >
                            <NetworkLogo op={o.value} size={30} />
                            <span className={`text-[11px] font-semibold leading-tight text-center ${active ? "text-ink-strong" : "text-ink-dim"}`}>
                              {o.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {error && (
                    <div className="text-[12.5px] font-medium text-coral">{error}</div>
                  )}

                  <button
                    type="button"
                    disabled={loading}
                    onClick={submitMobileMoney}
                    className={`w-full py-3 rounded-xl text-[14px] font-bold transition-all active:scale-98 bg-[linear-gradient(135deg,var(--teal),#069E9A)] text-white shadow-[0_4px_14px_rgba(8,174,170,0.3)] ${loading ? "opacity-70" : "opacity-100"}`}
                  >
                    {loading ? "Initiating…" : `Pay K${price}`}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <Icon name="credit_card" size={40} className="text-ink-dim" />
                  <div>
                    <div className="font-semibold text-[14.5px] mb-1 text-ink-strong">
                      Card payments coming soon
                    </div>
                    <p className="text-[13px] text-ink-dim">
                      Use Mobile Money to pay now: Airtel, MTN, and Zamtel are all supported.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMethod("mobile")}
                    className="px-5 py-2 rounded-full text-[13px] font-semibold transition-all bg-[rgba(8,174,170,0.1)] text-teal border border-[rgba(8,174,170,0.2)]"
                  >
                    Switch to Mobile Money
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Screen: waiting ── */}
          {screen === "waiting" && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="size-16 rounded-full flex items-center justify-center bg-[rgba(8,174,170,0.1)] border-2 border-[rgba(8,174,170,0.3)]">
                <Icon name="smartphone" size={32} className="text-teal" />
              </div>

              <div className="text-center">
                <div className="font-display font-semibold text-[16px] mb-1 text-ink-strong">
                  Check your phone
                </div>
                <p className="text-[13px] text-ink-dim">
                  Approve the payment prompt from <strong className="text-ink-mid">{OPERATORS.find(o => o.value === operator)?.label}</strong>.
                  This page will update automatically.
                </p>
              </div>

              {!timedOut ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-1.5">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="size-2 rounded-full bg-teal opacity-70"
                        style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                      />
                    ))}
                  </div>
                  <div className="text-[12px] text-ink-dim">
                    Checking… ({Math.min(polls, POLL_MAX)} / {POLL_MAX})
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="text-[12.5px] text-center text-ink-dim">
                    Not confirmed yet. Make sure you approved the prompt.
                  </div>
                  {error && <div className="text-[12px] text-coral">{error}</div>}
                  <button
                    type="button"
                    onClick={manualVerify}
                    className="px-5 py-2 rounded-xl text-[13px] font-semibold bg-[rgba(8,174,170,0.1)] text-teal border border-[rgba(8,174,170,0.2)]"
                  >
                    Check again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Screen: success ── */}
          {screen === "success" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="size-20 rounded-full flex items-center justify-center bg-[rgba(8,174,170,0.12)] border-2 border-[rgba(8,174,170,0.4)]">
                <Icon name="check_circle" size={40} className="text-teal" />
              </div>
              <div className="text-center">
                <div className="font-display font-bold text-[18px] mb-1 text-ink-strong">
                  You&apos;re now on {planCfg.name}!
                </div>
                <p className="text-[13px] text-ink-dim">
                  Your account has been upgraded. All features are now unlocked.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1);    }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
