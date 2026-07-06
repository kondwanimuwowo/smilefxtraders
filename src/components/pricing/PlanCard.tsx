"use client";

import type { ReactNode } from "react";
import type { PlanMeta, PlanPrices } from "@/lib/plans";

export interface PlanCardProps {
  meta: PlanMeta;
  prices: PlanPrices;
  annual: boolean;
  showUsd?: boolean;
  renderCta: (meta: PlanMeta, annual: boolean) => ReactNode;
}

function FeatureRow({ text, included }: { text: string; included: boolean }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <span
        className="material-symbols-rounded shrink-0 mt-0.5"
        style={{ fontSize: 16, color: included ? "var(--teal)" : "var(--track)", fontFamily: "Material Symbols Rounded Fill" }}
      >
        {included ? "check_circle" : "cancel"}
      </span>
      <span
        className="text-[13px] leading-snug"
        style={{ color: included ? "var(--ink-mid)" : "var(--ink-dim)", opacity: included ? 1 : 0.55 }}
      >
        {text}
      </span>
    </div>
  );
}

export function PlanCard({ meta, prices, annual, showUsd = false, renderCta }: PlanCardProps) {
  const zmw = annual ? prices.annualZmw : prices.monthlyZmw;
  const usd = annual ? prices.annualUsd  : prices.monthlyUsd;

  return (
    <div
      className="rounded-2xl flex flex-col"
      style={{
        background: meta.popular
          ? "linear-gradient(175deg, rgba(8,174,170,0.07) 0%, transparent 40%), var(--panel, #fff)"
          : "var(--panel, #fff)",
        border:    meta.popular ? "2px solid rgba(8,174,170,0.4)" : "1px solid var(--line, #e5e9f0)",
        position:  "relative",
        marginTop: meta.popular ? 0 : 14,
      }}
    >
      {meta.popular && (
        <div
          className="absolute left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
          style={{ background: "var(--teal)", color: "#fff", top: -14 }}
        >
          Most popular
        </div>
      )}

      <div className="px-6 pt-7 pb-5">
        {/* Icon + name */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="size-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${meta.color}18` }}
          >
            <span
              className="material-symbols-rounded"
              style={{ fontSize: 22, color: meta.color, fontFamily: "Material Symbols Rounded Fill" }}
            >
              {meta.icon}
            </span>
          </div>
          <div className="font-display font-bold text-[17px]" style={{ color: "var(--ink-strong)" }}>
            {meta.name}
          </div>
        </div>

        {/* Price */}
        <div className="mb-2">
          {zmw === 0 ? (
            <div className="font-display font-bold text-[34px]" style={{ color: "var(--ink-strong)", letterSpacing: "-0.03em" }}>
              Free
            </div>
          ) : (
            <>
              {showUsd && usd > 0 && (
                <div className="flex items-end gap-1.5">
                  <span className="font-display font-bold text-[34px]" style={{ color: meta.color, letterSpacing: "-0.03em" }}>
                    ${usd}
                  </span>
                  <span className="text-[14px] mb-2" style={{ color: "var(--ink-dim)" }}>/mo</span>
                </div>
              )}
              <div className="flex items-end gap-1.5">
                <span
                  className={`font-display font-bold ${showUsd ? "text-[22px]" : "text-[34px]"}`}
                  style={{ color: showUsd ? "var(--ink-dim)" : meta.color, letterSpacing: "-0.03em" }}
                >
                  K{zmw}
                </span>
                <span className="text-[14px] mb-2" style={{ color: "var(--ink-dim)" }}>/mo</span>
              </div>
              <div className="text-[12.5px]" style={{ color: "var(--ink-dim)" }}>
                {annual ? "billed annually" : "billed monthly"} · ZMW
              </div>
              {annual && (
                <div className="text-[12px] font-semibold mt-1" style={{ color: "var(--teal)" }}>
                  Save 20% with annual billing
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-[13px] leading-relaxed mb-5" style={{ color: "var(--ink-dim)" }}>{meta.tagline}</p>

        {renderCta(meta, annual)}
      </div>

      {/* Feature list */}
      <div className="px-6 pb-6 flex-1">
        <div className="pt-4 border-t" style={{ borderColor: "var(--line)" }}>
          {meta.features.map((f) => (
            <FeatureRow key={f.text} text={f.text} included={f.included} />
          ))}
        </div>
      </div>
    </div>
  );
}
