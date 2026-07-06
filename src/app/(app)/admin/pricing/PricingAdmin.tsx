"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { PLAN_META } from "@/lib/plans";
import type { PlanPrices } from "@/lib/plans";

interface Props {
  initial: PlanPrices[];
}

export function PricingAdmin({ initial }: Props) {
  const { toast } = useStore();
  const [prices, setPrices] = useState<PlanPrices[]>(initial);
  const [saving, setSaving] = useState<string | null>(null);

  function update(planId: string, field: keyof Omit<PlanPrices, "planId">, value: string) {
    const num = parseInt(value, 10) || 0;
    setPrices((prev) => prev.map((p) => p.planId === planId ? { ...p, [field]: num } : p));
  }

  async function save(planId: string) {
    const config = prices.find((p) => p.planId === planId);
    if (!config) return;
    setSaving(planId);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Failed");
      toast("Prices saved", "teal", "check_circle");
    } catch {
      toast("Failed to save", "coral", "error");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="view">
      <div className="mb-8">
        <h1 className="font-display font-bold text-[26px]" style={{ color: "var(--ink-strong)", letterSpacing: "-0.02em" }}>
          Pricing Configuration
        </h1>
        <p className="text-[14px] mt-1" style={{ color: "var(--ink-dim)" }}>
          Edit plan prices. Changes apply immediately to the pricing page and checkout.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {PLAN_META.map((meta) => {
          const p = prices.find((x) => x.planId === meta.id);
          if (!p) return null;
          const isFree = meta.id === "free";

          return (
            <div
              key={meta.id}
              className="rounded-2xl"
              style={{ background: "var(--panel)", border: "1px solid var(--line)", padding: "24px 28px" }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="size-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${meta.color}18` }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 20, color: meta.color, fontFamily: "Material Symbols Rounded Fill" }}>
                    {meta.icon}
                  </span>
                </div>
                <div>
                  <div className="font-display font-bold text-[16px]" style={{ color: "var(--ink-strong)" }}>{meta.name}</div>
                  <div className="text-[12px]" style={{ color: "var(--ink-dim)" }}>{meta.tagline}</div>
                </div>
                {meta.popular && (
                  <span className="ml-auto text-[11px] font-bold px-3 py-1 rounded-full" style={{ background: "rgba(8,174,170,0.12)", color: "var(--teal)" }}>
                    Most popular
                  </span>
                )}
              </div>

              {isFree ? (
                <p className="text-[13px]" style={{ color: "var(--ink-dim)" }}>Free plan: no pricing to configure.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {(["monthlyZmw", "annualZmw", "monthlyUsd", "annualUsd"] as const).map((field) => {
                    const labels: Record<string, string> = {
                      monthlyZmw: "Monthly (ZMW)",
                      annualZmw:  "Annual / month (ZMW)",
                      monthlyUsd: "Monthly (USD)",
                      annualUsd:  "Annual / month (USD)",
                    };
                    const prefixes: Record<string, string> = {
                      monthlyZmw: "K", annualZmw: "K", monthlyUsd: "$", annualUsd: "$",
                    };
                    return (
                      <div key={field}>
                        <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "var(--ink-mid)" }}>
                          {labels[field]}
                        </label>
                        <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "1px solid var(--line)", background: "var(--panel-2)" }}>
                          <span className="px-3 text-[13px] font-mono font-semibold py-2.5 border-r" style={{ color: "var(--ink-dim)", borderColor: "var(--line)", background: "var(--panel)" }}>
                            {prefixes[field]}
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={p[field]}
                            onChange={(e) => update(meta.id, field, e.target.value)}
                            className="flex-1 px-3 py-2.5 text-[13.5px] font-mono bg-transparent outline-none"
                            style={{ color: "var(--ink-strong)" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!isFree && (
                <div className="flex justify-end mt-5">
                  <button
                    type="button"
                    onClick={() => save(meta.id)}
                    disabled={saving === meta.id}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, var(--teal), #069E9A)" }}
                  >
                    {saving === meta.id ? (
                      <span className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <span className="material-symbols-rounded" style={{ fontSize: 16 }}>save</span>
                    )}
                    Save {meta.name}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl px-5 py-4 flex items-start gap-3" style={{ background: "rgba(248,185,61,0.08)", border: "1px solid rgba(248,185,61,0.25)" }}>
        <span className="material-symbols-rounded" style={{ fontSize: 18, color: "var(--gold)", marginTop: 1 }}>info</span>
        <p className="text-[13px]" style={{ color: "var(--ink-mid)", lineHeight: 1.6 }}>
          Annual prices are per month (billed as a lump sum). Example: K239/mo annual = K2,868 charged once a year.
          Leave at 0 to show &quot;Free&quot;.
        </p>
      </div>
    </div>
  );
}
