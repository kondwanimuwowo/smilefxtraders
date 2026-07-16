import type { Metadata } from "next";
import { Icon } from "@/components/ui";

export const metadata: Metadata = {
  title: "Blog & Market Insights | Smile FX Traders",
  description: "Market commentary and trading insights from Smile FX Traders, coming soon.",
};

export default function BlogPage() {
  return (
    <section className="dark min-h-[70vh] flex items-center py-32 bg-[radial-gradient(ellipse_at_12%_18%,rgba(8,174,170,0.45)_0%,transparent_52%),radial-gradient(ellipse_at_88%_88%,rgba(248,185,61,0.32)_0%,transparent_48%),linear-gradient(155deg,#0C4E6B_0%,#082A3B_60%)]">
      <div className="container">
        <div className="sec-head center reveal">
          <Icon name="menu_book" size={40} className="mx-auto mb-4 text-teal-bright" />
          <h2 className="m-0 font-extrabold tracking-[-0.01em] leading-[1.18] text-[clamp(28px,3.8vw,46px)]">Market Insights, coming soon</h2>
          <p className="lead mt-[18px]">We&apos;re building a home for weekly market commentary, COT breakdowns, and trading write-ups. Check back soon.</p>
        </div>
      </div>
    </section>
  );
}
