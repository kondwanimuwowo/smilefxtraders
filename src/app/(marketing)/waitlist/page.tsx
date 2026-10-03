import type { Metadata } from "next";
import { WaitlistForm } from "@/components/marketing/WaitlistForm";

export const metadata: Metadata = {
  title: "Join the Waitlist — Smile FX Traders",
  description: "Smile FX Traders is launching soon. Join the waitlist to be the first to know.",
};

// Dark hero, like the other public pages. The transparent marketing header
// uses light text, so it needs a dark surface behind it at the top of the page.
export default function WaitlistPage() {
  return (
    <section className="dark min-h-[80vh] flex items-center justify-center px-5 pt-32 pb-20 bg-[radial-gradient(ellipse_at_12%_18%,rgba(8,174,170,0.45)_0%,transparent_52%),radial-gradient(ellipse_at_88%_88%,rgba(248,185,61,0.32)_0%,transparent_48%),linear-gradient(155deg,#0C4E6B_0%,#082A3B_60%)]">
      <div className="text-center max-w-lg">
        <h1 className="font-display text-[clamp(32px,5vw,48px)] tracking-[-0.02em] text-white">
          We&apos;re launching soon
        </h1>
        <p className="text-[15px] text-white/76 mt-4 leading-relaxed">
          Smile FX Traders isn&apos;t open yet. Leave your email and we&apos;ll let you know
          the moment doors open.
        </p>
        <div className="flex justify-center mt-8">
          <WaitlistForm source="waitlist" onDark />
        </div>
      </div>
    </section>
  );
}
