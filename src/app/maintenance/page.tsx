import type { Metadata } from "next";
import { WaitlistForm } from "@/components/marketing/WaitlistForm";

export const metadata: Metadata = {
  title: "Down for Maintenance — Smile FX Traders",
  description: "Smile FX Traders is briefly down for maintenance. Leave your email and we'll let you know when we're back.",
};

// Deliberately standalone -- outside the (marketing) route group, so it does
// not inherit MarketingNav/MarketingFooter. A true splash screen: no site
// chrome, nothing else reachable while this is up.
export default function MaintenancePage() {
  return (
    <div
      className="on-dark min-h-screen flex flex-col items-center justify-center px-6 text-center bg-navy-deep bg-[radial-gradient(ellipse_at_15%_12%,rgba(8,174,170,0.32)_0%,transparent_50%),radial-gradient(ellipse_at_90%_85%,rgba(248,185,61,0.18)_0%,transparent_48%)]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/smile-fx-logo-wht.png" alt="Smile FX Traders" width={48} height={48} className="rounded-[12px] mb-6" />
      <h1 className="font-display text-[clamp(28px,5vw,44px)] tracking-[-0.02em] text-white">
        Down for maintenance
      </h1>
      <p className="text-[15px] text-white/70 mt-4 leading-relaxed max-w-md">
        We&apos;re making some improvements and will be back shortly. Leave your email and
        we&apos;ll let you know the moment we&apos;re back.
      </p>
      <div className="flex justify-center mt-8">
        <WaitlistForm source="maintenance" onDark />
      </div>
    </div>
  );
}
