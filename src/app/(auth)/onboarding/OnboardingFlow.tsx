"use client";

import { useState, useTransition, useEffect } from "react";
import { Button, Icon } from "@/components/ui";
import { saveOnboardingAction } from "../actions";
import type { Framework } from "@/lib/frameworks";
import { useInstruments } from "@/lib/hooks/useInstruments";

const FRAMEWORKS: { key: Framework; label: string; sub: string; icon: string; accent: string }[] = [
  { key: "SMC",  label: "Smart Money Concepts (ICT)", sub: "Order blocks, FVGs, liquidity sweeps",  icon: "psychology",        accent: "var(--teal)" },
  { key: "SnD",  label: "Supply & Demand",            sub: "Fresh zones, impulsive origins, premium/discount", icon: "layers", accent: "var(--gold)" },
];

const INSTRUMENTS_FALLBACK = [
  { key: "EURUSD", label: "EUR/USD" },
  { key: "GBPUSD", label: "GBP/USD" },
  { key: "NZDUSD", label: "NZD/USD" },
  { key: "XAUUSD", label: "XAU/USD" },
  { key: "NAS100", label: "NAS100" },
];

const EXPERIENCE_OPTIONS = [
  { value: "Beginner",     desc: "New to trading: start at Foundations" },
  { value: "Intermediate", desc: "Know structure & liquidity, refining entries" },
  { value: "Advanced",     desc: "Consistent, working toward funding" },
];

export function OnboardingFlow() {
  const { data: dbInstruments = [] } = useInstruments();
  const instrumentOptions = dbInstruments.length
    ? dbInstruments.map((i) => ({ key: i.symbol, label: i.label }))
    : INSTRUMENTS_FALLBACK;
  const [step, setStep] = useState(0);
  const [framework,   setFramework]   = useState<Framework>("SMC");
  const [instruments, setInstruments] = useState<string[]>([]);
  const [riskPct,     setRiskPct]     = useState(0.5);

  // Default-select first two instruments once they load from DB
  useEffect(() => {
    if (instruments.length === 0 && instrumentOptions.length > 0) {
      setInstruments(instrumentOptions.slice(0, 2).map((i) => i.key));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instrumentOptions]);
  const [experience,  setExperience]  = useState("Intermediate");
  const [isPending,   startTransition] = useTransition();

  const totalSteps = 4;

  const toggleInstrument = (key: string) =>
    setInstruments((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  function handleFinish() {
    const fd = new FormData();
    fd.set("framework", framework);
    instruments.forEach((ins) => fd.append("instruments", ins));
    fd.set("riskPct", String(riskPct));
    fd.set("experience", experience);
    startTransition(async () => { await saveOnboardingAction(fd); });
  }

  return (
    <div className="flex flex-col">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className="h-1 rounded-full flex-1 transition-colors"
            style={{ background: i <= step ? "var(--teal)" : "var(--track)" }}
          />
        ))}
      </div>
      <div className="text-[11px] font-semibold mb-5 mt-1" style={{ color: "var(--ink-dim)" }}>
        Step {step + 1} of {totalSteps}
      </div>

      {/* Step 0 — Framework */}
      {step === 0 && (
        <>
          <h1 className="font-display font-semibold mb-1" style={{ fontSize: 24, color: "var(--ink-strong)" }}>
            What&apos;s your trading system?
          </h1>
          <p className="text-[13.5px] mb-5 leading-relaxed" style={{ color: "var(--ink-mid)" }}>
            Your default for the journal, validator, and Gavo AI reviews. You can change this anytime in settings.
          </p>
          <div className="flex flex-col gap-3">
            {FRAMEWORKS.map(({ key, label, sub, icon, accent }) => {
              const selected = framework === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFramework(key)}
                  className="relative flex items-center gap-4 p-4 rounded-xl border text-left transition-all"
                  style={
                    selected
                      ? { borderColor: accent, background: `color-mix(in srgb, ${accent} 8%, transparent)` }
                      : { borderColor: "var(--line)", background: "var(--panel-2)" }
                  }
                >
                  <div
                    className="size-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: selected ? `color-mix(in srgb, ${accent} 15%, transparent)` : "var(--track)" }}
                  >
                    <span
                      className="material-symbols-rounded"
                      style={{ fontSize: 20, color: selected ? accent : "var(--ink-dim)", fontVariationSettings: "'FILL' 1" }}
                    >
                      {icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[14.5px]" style={{ color: "var(--ink-strong)" }}>
                      {label}
                    </div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: "var(--ink-dim)" }}>{sub}</div>
                  </div>
                  <Icon
                    name={selected ? "radio_button_checked" : "radio_button_unchecked"}
                    size={20}
                    style={{ color: selected ? accent : "var(--ink-dim)", flexShrink: 0 }}
                  />
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Step 1 — Instruments */}
      {step === 1 && (
        <>
          <h1 className="font-display font-semibold mb-1" style={{ fontSize: 24, color: "var(--ink-strong)" }}>
            What do you trade?
          </h1>
          <p className="text-[13.5px] mb-5 leading-relaxed" style={{ color: "var(--ink-mid)" }}>
            Pick the instruments you focus on. We&apos;ll tailor your watchlist and calendar.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {instrumentOptions.map(({ key, label }) => {
              const selected = instruments.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleInstrument(key)}
                  className="relative flex flex-col items-start p-4 rounded-xl border text-left transition-all"
                  style={
                    selected
                      ? { borderColor: "var(--teal)", background: "rgba(8,174,170,0.08)" }
                      : { borderColor: "var(--line)", background: "var(--panel-2)" }
                  }
                >
                  <span className="font-semibold text-[15px]" style={{ color: "var(--ink-strong)" }}>
                    {key}
                  </span>
                  <span className="text-[12px] mt-0.5" style={{ color: "var(--ink-dim)" }}>
                    {label}
                  </span>
                  {selected && (
                    <span className="absolute top-2.5 right-2.5">
                      <Icon name="check_circle" size={18} fill style={{ color: "var(--teal)" }} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Step 2 — Risk */}
      {step === 2 && (
        <>
          <h1 className="font-display font-semibold mb-1" style={{ fontSize: 24, color: "var(--ink-strong)" }}>
            Set your risk
          </h1>
          <p className="text-[13.5px] mb-6 leading-relaxed" style={{ color: "var(--ink-mid)" }}>
            How much of your account do you risk per trade? Discipline starts here.
          </p>
          <div className="text-center mb-6">
            <div className="font-display font-bold" style={{ fontSize: 52, color: "var(--teal)" }}>
              {riskPct}%
            </div>
            <div className="text-[13px] mt-1" style={{ color: "var(--ink-dim)" }}>per trade</div>
          </div>
          <input
            type="range"
            className="auth-range w-full"
            min={0.25}
            max={3}
            step={0.25}
            value={riskPct}
            onChange={(e) => setRiskPct(parseFloat(e.target.value))}
          />
          <div className="flex justify-between text-[11.5px] mt-2" style={{ color: "var(--ink-dim)" }}>
            <span>0.25% · Conservative</span>
            <span>3% · Aggressive</span>
          </div>
        </>
      )}

      {/* Step 3 — Experience */}
      {step === 3 && (
        <>
          <h1 className="font-display font-semibold mb-1" style={{ fontSize: 24, color: "var(--ink-strong)" }}>
            Your experience
          </h1>
          <p className="text-[13.5px] mb-5 leading-relaxed" style={{ color: "var(--ink-mid)" }}>
            We&apos;ll point you to the right place in the Academy.
          </p>
          <div className="flex flex-col gap-2.5">
            {EXPERIENCE_OPTIONS.map(({ value, desc }) => {
              const active = experience === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setExperience(value)}
                  className="flex items-center justify-between p-4 rounded-xl border text-left transition-all"
                  style={
                    active
                      ? { borderColor: "var(--teal)", background: "rgba(8,174,170,0.08)" }
                      : { borderColor: "var(--line)", background: "var(--panel-2)" }
                  }
                >
                  <div>
                    <div className="font-semibold text-[14.5px]" style={{ color: "var(--ink-strong)" }}>
                      {value}
                    </div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: "var(--ink-dim)" }}>{desc}</div>
                  </div>
                  <Icon
                    name={active ? "radio_button_checked" : "radio_button_unchecked"}
                    size={20}
                    style={{ color: active ? "var(--teal)" : "var(--ink-dim)", flexShrink: 0 }}
                  />
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-7">
        {step > 0 && (
          <Button type="button" variant="ghost" icon="arrow_back" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
        {step < totalSteps - 1 ? (
          <Button
            type="button"
            variant="primary"
            fullWidth
            iconRight="arrow_forward"
            disabled={step === 1 && instruments.length === 0}
            onClick={() => setStep(step + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            fullWidth
            icon="rocket_launch"
            loading={isPending}
            onClick={handleFinish}
          >
            Enter platform
          </Button>
        )}
      </div>
    </div>
  );
}
