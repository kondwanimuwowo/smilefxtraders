import type { Metadata } from "next";
import { WaitlistForm } from "@/components/marketing/WaitlistForm";

export const metadata: Metadata = {
  title: "Join the Waitlist — Smile FX Traders",
  description: "Smile FX Traders is launching soon. Join the waitlist to be the first to know.",
};

export default function WaitlistPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-5 pt-32 pb-20">
      <div className="text-center max-w-lg">
        <h1 className="font-display text-[clamp(32px,5vw,48px)] tracking-[-0.02em] text-ink-strong">
          We&apos;re launching soon
        </h1>
        <p className="text-[15px] text-ink-mid mt-4 leading-relaxed">
          Smile FX Traders isn&apos;t open yet. Leave your email and we&apos;ll let you know
          the moment doors open.
        </p>
        <div className="flex justify-center mt-8">
          <WaitlistForm source="waitlist" />
        </div>
      </div>
    </div>
  );
}
