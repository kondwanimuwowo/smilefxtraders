"use client";

import type { ReactNode } from "react";
import type { PlanMeta, PlanPrices } from "@/lib/plans";
import { cn } from "@/lib/cn";

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
        className={cn("material-symbols-rounded shrink-0 mt-0.5 text-[16px]", included ? "text-teal" : "text-track")}
        style={{ fontFamily: "Material Symbols Rounded Fill" }}
      >
        {included ? "check_circle" : "cancel"}
      </span>
      <span className={cn("text-[13px] leading-snug", included ? "text-ink-mid opacity-100" : "text-ink-dim opacity-55")}>
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
      className={cn(
        "rounded-2xl flex flex-col relative",
        meta.popular
          ? "bg-[linear-gradient(175deg,rgba(8,174,170,0.07)_0%,transparent_40%),var(--panel,#fff)] border-2 border-[rgba(8,174,170,0.4)] mt-0"
          : "bg-[var(--panel,#fff)] border border-[var(--line,#e5e9f0)] mt-3.5"
      )}
    >
      {meta.popular && (
        <div className="absolute left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal text-white -top-3.5">
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
              className="material-symbols-rounded text-[22px]"
              style={{ color: meta.color, fontFamily: "Material Symbols Rounded Fill" }}
            >
              {meta.icon}
            </span>
          </div>
          <div className="font-display font-bold text-[17px] text-ink-strong">
            {meta.name}
          </div>
        </div>

        {/* Price */}
        <div className="mb-2">
          {zmw === 0 ? (
            <div className="font-display font-bold text-[34px] tracking-[-0.03em] text-ink-strong">
              Free
            </div>
          ) : (
            <>
              {showUsd && usd > 0 && (
                <div className="flex items-end gap-1.5">
                  <span className="font-display font-bold text-[34px] tracking-[-0.03em]" style={{ color: meta.color }}>
                    ${usd}
                  </span>
                  <span className="text-[14px] mb-2 text-ink-dim">/mo</span>
                </div>
              )}
              <div className="flex items-end gap-1.5">
                <span
                  className={cn("font-display font-bold tracking-[-0.03em]", showUsd ? "text-[22px]" : "text-[34px]")}
                  style={{ color: showUsd ? "var(--ink-dim)" : meta.color }}
                >
                  K{zmw}
                </span>
                <span className="text-[14px] mb-2 text-ink-dim">/mo</span>
              </div>
              <div className="text-[12.5px] text-ink-dim">
                {annual ? "billed annually" : "billed monthly"} · ZMW
              </div>
              {annual && (
                <div className="text-[12px] font-semibold mt-1 text-teal">
                  Save 20% with annual billing
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-[13px] leading-relaxed mb-5 text-ink-dim">{meta.tagline}</p>

        {renderCta(meta, annual)}
      </div>

      {/* Feature list */}
      <div className="px-6 pb-6 flex-1">
        <div className="pt-4 border-t border-line">
          {meta.features.map((f) => (
            <FeatureRow key={f.text} text={f.text} included={f.included} />
          ))}
        </div>
      </div>
    </div>
  );
}
