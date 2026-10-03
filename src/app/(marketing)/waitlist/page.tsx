import type { Metadata } from "next";
import { WaitlistForm } from "@/components/marketing/WaitlistForm";
import { Icon } from "@/components/ui";

export const metadata: Metadata = {
  title: "Join the Waitlist — Smile FX Traders",
  description: "Smile FX Traders is launching soon. Join the waitlist to be the first to know.",
};

const PREVIEWS = [
  { icon: "menu_book", title: "Journal and validate", body: "Log every trade and check each setup against the rulebook before you take it." },
  { icon: "analytics", title: "Live macro and COT", body: "Currency scores, institutional positioning, and economic releases in one place." },
  { icon: "school", title: "Learn SMC properly", body: "Structured lessons from market-structure basics to funded-account execution." },
];

// The hero is full-bleed dark so the transparent header's light text has a
// surface behind it at the top of the page. Its bottom corners are rounded and
// the benefit cards sit below it, so the hero no longer meets the footer.
export default function WaitlistPage() {
  return (
    <>
      <section className="dark pt-32 pb-20 px-5 text-center bg-[radial-gradient(ellipse_at_12%_18%,rgba(8,174,170,0.45)_0%,transparent_52%),radial-gradient(ellipse_at_88%_88%,rgba(248,185,61,0.32)_0%,transparent_48%),linear-gradient(155deg,#0C4E6B_0%,#082A3B_60%)]">
        <div className="max-w-lg mx-auto">
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

      <section className="px-4 sm:px-6 pt-24 pb-32 mx-auto max-w-4xl grid gap-6 sm:grid-cols-3">
        {PREVIEWS.map((item) => (
          <div key={item.title} className="rounded-2xl bg-panel p-6 shadow-sm">
            <div className="flex items-center justify-center size-10 rounded-xl bg-teal-tint text-teal-deep mb-4">
              <Icon name={item.icon} size={20} />
            </div>
            <h2 className="font-display text-[17px] font-semibold text-ink-strong">{item.title}</h2>
            <p className="text-[13.5px] text-ink-mid mt-2 leading-relaxed">{item.body}</p>
          </div>
        ))}
      </section>
    </>
  );
}
