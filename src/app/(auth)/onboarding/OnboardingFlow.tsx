"use client";

import { useState, useTransition, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Icon } from "@/components/ui";
import { saveOnboardingAction } from "../actions";
import type { Framework } from "@/lib/frameworks";
import { useInstruments } from "@/lib/hooks/useInstruments";
import { isValidPhone } from "@/lib/validation";
import { cn } from "@/lib/cn";

const FRAMEWORKS: {
  key: Framework; label: string; sub: string; icon: string;
  selectedCls: string; iconBoxCls: string; iconCls: string; radioCls: string;
}[] = [
  {
    key: "SMC", label: "Smart Money Concepts (ICT)", sub: "Order blocks, FVGs, liquidity sweeps", icon: "psychology",
    selectedCls: "border-teal bg-[color-mix(in_srgb,var(--teal)_8%,transparent)]",
    iconBoxCls:  "bg-[color-mix(in_srgb,var(--teal)_15%,transparent)]",
    iconCls:     "text-teal",
    radioCls:    "text-teal",
  },
  {
    key: "SnD", label: "Supply & Demand", sub: "Fresh zones, impulsive origins, premium/discount", icon: "layers",
    selectedCls: "border-gold bg-[color-mix(in_srgb,var(--gold)_8%,transparent)]",
    iconBoxCls:  "bg-[color-mix(in_srgb,var(--gold)_15%,transparent)]",
    iconCls:     "text-gold",
    radioCls:    "text-gold",
  },
];

const INSTRUMENTS_FALLBACK = [
  { key: "EURUSD", label: "EUR/USD" },
  { key: "GBPUSD", label: "GBP/USD" },
  { key: "NZDUSD", label: "NZD/USD" },
  { key: "XAUUSD", label: "XAU/USD" },
  { key: "NAS100", label: "NAS100" },
];

const SKILL_OPTIONS = [
  { value: "Beginner",     desc: "New to trading: start at Foundations" },
  { value: "Intermediate", desc: "Know structure & liquidity, refining entries" },
  { value: "Advanced",     desc: "Consistent, working toward funding" },
];

const DURATION_OPTIONS = [
  { value: "<6m",   label: "Less than 6 months" },
  { value: "6-12m", label: "6–12 months" },
  { value: "1-3y",  label: "1–3 years" },
  { value: "3y+",   label: "3+ years" },
];

const GOAL_OPTIONS = [
  { value: "consistency", label: "Build consistency",         desc: "Trade with a repeatable process, not gut feel" },
  { value: "funded",      label: "Pass a funded challenge",   desc: "Get evaluated and trade with prop firm capital" },
  { value: "learn",       label: "Learn from scratch",        desc: "New to SMC/Supply & Demand, starting at the basics" },
  { value: "grow_live",   label: "Grow a live account",       desc: "Already trading, want to scale it up" },
];

const COUNTRIES = [
  "Zambia", "South Africa", "Nigeria", "Kenya", "Ghana", "Zimbabwe", "Tanzania", "Uganda", "Other",
];

export function OnboardingFlow() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const { data: dbInstruments = [] } = useInstruments();
  const instrumentOptions = dbInstruments.length
    ? dbInstruments.map((i) => ({ key: i.symbol, label: i.label }))
    : INSTRUMENTS_FALLBACK;
  const [step, setStep] = useState(0);
  const [country,      setCountry]      = useState("Zambia");
  const [phone,        setPhone]        = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [framework,   setFramework]   = useState<Framework>("SMC");
  const [tradingDuration, setTradingDuration] = useState("");
  const [skill,       setSkill]       = useState("Intermediate");
  const [goal,        setGoal]        = useState("");
  const [instruments, setInstruments] = useState<string[]>([]);
  const [riskPct,     setRiskPct]     = useState(0.5);

  // Default-select first two instruments once they load from DB
  useEffect(() => {
    if (instruments.length === 0 && instrumentOptions.length > 0) {
      setInstruments(instrumentOptions.slice(0, 2).map((i) => i.key));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instrumentOptions]);
  const [isPending,   startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const totalSteps = 7;
  const phoneValid = isValidPhone(phone);

  const toggleInstrument = (key: string) =>
    setInstruments((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  function handleFinish() {
    const fd = new FormData();
    fd.set("country", country);
    fd.set("phone", phone.trim());
    fd.set("framework", framework);
    fd.set("tradingDuration", tradingDuration);
    fd.set("experience", skill);
    fd.set("goal", goal);
    instruments.forEach((ins) => fd.append("instruments", ins));
    fd.set("riskPct", String(riskPct));
    fd.set("plan", plan ?? "");
    startTransition(async () => {
      const result = await saveOnboardingAction(fd);
      if (result?.error) setServerError(result.error);
    });
  }

  const canContinue =
    (step !== 0 || phoneValid) &&
    (step !== 2 || tradingDuration !== "") &&
    (step !== 4 || goal !== "") &&
    (step !== 5 || instruments.length > 0);

  return (
    <div className="flex flex-col">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full flex-1 transition-colors ${i <= step ? "bg-teal" : "bg-track"}`}
          />
        ))}
      </div>
      <div className="text-[11px] font-semibold mb-5 mt-1 text-ink-dim">
        Step {step + 1} of {totalSteps}
      </div>

      {/* Step 0 — General: Country + Phone */}
      {step === 0 && (
        <>
          <h1 className="font-display font-semibold mb-1 text-2xl text-ink-strong">
            How can we reach you?
          </h1>
          <p className="text-[13.5px] mb-5 leading-relaxed text-ink-mid">
            Used for account recovery and important alerts. Include your country code.
          </p>
          <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5 text-ink-dim">Country</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border text-[15px] mb-4 bg-panel-2 border-line text-ink-strong"
          >
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5 text-ink-dim">Phone number</label>
          <input
            type="tel"
            inputMode="tel"
            autoFocus
            placeholder="+260971234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => setPhoneTouched(true)}
            className={`w-full px-4 py-3 rounded-xl border text-[15px] bg-panel-2 text-ink-strong ${
              phoneTouched && !phoneValid ? "border-coral" : "border-line"
            }`}
          />
          {phoneTouched && !phoneValid && (
            <p className="text-[12.5px] mt-2 text-coral">
              Enter a valid phone number in international format, e.g. +260971234567.
            </p>
          )}
        </>
      )}

      {/* Step 1 — Framework */}
      {step === 1 && (
        <>
          <h1 className="font-display font-semibold mb-1 text-2xl text-ink-strong">
            What&apos;s your trading system?
          </h1>
          <p className="text-[13.5px] mb-5 leading-relaxed text-ink-mid">
            Your default for the journal, validator, and Gavo AI reviews. You can change this anytime in settings.
          </p>
          <div className="flex flex-col gap-3">
            {FRAMEWORKS.map(({ key, label, sub, icon, selectedCls, iconBoxCls, iconCls, radioCls }) => {
              const selected = framework === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFramework(key)}
                  className={cn(
                    "relative flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
                    selected ? selectedCls : "border-line bg-panel-2"
                  )}
                >
                  <div
                    className={cn(
                      "size-10 rounded-xl flex items-center justify-center shrink-0",
                      selected ? iconBoxCls : "bg-track"
                    )}
                  >
                    <Icon name={icon} size={20} className={selected ? iconCls : "text-ink-dim"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[14.5px] text-ink-strong">
                      {label}
                    </div>
                    <div className="text-[12.5px] mt-0.5 text-ink-dim">{sub}</div>
                  </div>
                  <Icon
                    name={selected ? "radio_button_checked" : "radio_button_unchecked"}
                    size={20}
                    className={cn("shrink-0", selected ? radioCls : "text-ink-dim")}
                  />
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Step 2 — Experience: how long have you been trading */}
      {step === 2 && (
        <>
          <h1 className="font-display font-semibold mb-1 text-2xl text-ink-strong">
            How long have you been trading?
          </h1>
          <p className="text-[13.5px] mb-5 leading-relaxed text-ink-mid">
            No judgment — everyone starts somewhere.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {DURATION_OPTIONS.map(({ value, label }) => {
              const active = tradingDuration === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTradingDuration(value)}
                  className={cn(
                    "flex items-center justify-center p-4 rounded-xl border text-center font-semibold text-[14px] transition-all",
                    active ? "border-teal bg-[rgba(8,174,170,0.08)] text-ink-strong" : "border-line bg-panel-2 text-ink-mid"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Step 3 — Skill level */}
      {step === 3 && (
        <>
          <h1 className="font-display font-semibold mb-1 text-2xl text-ink-strong">
            Which best describes you?
          </h1>
          <p className="text-[13.5px] mb-5 leading-relaxed text-ink-mid">
            We&apos;ll point you to the right place in the Academy.
          </p>
          <div className="flex flex-col gap-2.5">
            {SKILL_OPTIONS.map(({ value, desc }) => {
              const active = skill === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSkill(value)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border text-left transition-all",
                    active ? "border-teal bg-[rgba(8,174,170,0.08)]" : "border-line bg-panel-2"
                  )}
                >
                  <div>
                    <div className="font-semibold text-[14.5px] text-ink-strong">
                      {value}
                    </div>
                    <div className="text-[12.5px] mt-0.5 text-ink-dim">{desc}</div>
                  </div>
                  <Icon
                    name={active ? "radio_button_checked" : "radio_button_unchecked"}
                    size={20}
                    className={cn("shrink-0", active ? "text-teal" : "text-ink-dim")}
                  />
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Step 4 — Goals */}
      {step === 4 && (
        <>
          <h1 className="font-display font-semibold mb-1 text-2xl text-ink-strong">
            What&apos;s your main goal right now?
          </h1>
          <p className="text-[13.5px] mb-5 leading-relaxed text-ink-mid">
            Helps us tailor tips and Academy suggestions.
          </p>
          <div className="flex flex-col gap-2.5">
            {GOAL_OPTIONS.map(({ value, label, desc }) => {
              const active = goal === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGoal(value)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border text-left transition-all",
                    active ? "border-teal bg-[rgba(8,174,170,0.08)]" : "border-line bg-panel-2"
                  )}
                >
                  <div>
                    <div className="font-semibold text-[14.5px] text-ink-strong">{label}</div>
                    <div className="text-[12.5px] mt-0.5 text-ink-dim">{desc}</div>
                  </div>
                  <Icon
                    name={active ? "radio_button_checked" : "radio_button_unchecked"}
                    size={20}
                    className={cn("shrink-0", active ? "text-teal" : "text-ink-dim")}
                  />
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Step 5 — Instruments */}
      {step === 5 && (
        <>
          <h1 className="font-display font-semibold mb-1 text-2xl text-ink-strong">
            What do you trade?
          </h1>
          <p className="text-[13.5px] mb-5 leading-relaxed text-ink-mid">
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
                  className={cn(
                    "relative flex flex-col items-start p-4 rounded-xl border text-left transition-all",
                    selected ? "border-teal bg-[rgba(8,174,170,0.08)]" : "border-line bg-panel-2"
                  )}
                >
                  <span className="font-semibold text-[15px] text-ink-strong">
                    {key}
                  </span>
                  <span className="text-[12px] mt-0.5 text-ink-dim">
                    {label}
                  </span>
                  {selected && (
                    <span className="absolute top-2.5 right-2.5">
                      <Icon name="check_circle" size={18} fill className="text-teal" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Step 6 — Risk */}
      {step === 6 && (
        <>
          <h1 className="font-display font-semibold mb-1 text-2xl text-ink-strong">
            Set your risk
          </h1>
          <p className="text-[13.5px] mb-6 leading-relaxed text-ink-mid">
            How much of your account do you risk per trade? Discipline starts here.
          </p>
          <div className="text-center mb-6">
            <div className="font-display font-bold text-[52px] text-teal">
              {riskPct}%
            </div>
            <div className="text-[13px] mt-1 text-ink-dim">per trade</div>
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
          <div className="flex justify-between text-[11.5px] mt-2 text-ink-dim">
            <span>0.25% · Conservative</span>
            <span>3% · Aggressive</span>
          </div>
        </>
      )}

      {/* Navigation */}
      {serverError && (
        <p className="text-[12.5px] mt-5 text-coral">{serverError}</p>
      )}
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
            disabled={!canContinue}
            onClick={() => {
              if (step === 0 && !phoneValid) { setPhoneTouched(true); return; }
              setStep(step + 1);
            }}
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
