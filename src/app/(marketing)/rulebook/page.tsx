import type { Metadata } from "next";
import { RulebookView } from "@/components/rulebook/RulebookView";
import { CTACard } from "@/components/marketing/CTACard";

export const metadata: Metadata = {
  title: "The Rulebook | Smile FX Traders",
  description:
    "The thirteen rules every Smile FX Traders setup is graded against, for Smart Money Concepts and Supply & Demand. Published in full, before you join.",
};

// Published rather than teased. The rulebook is the most concrete thing the
// platform can show a prospect: most competitors describe their edge, this
// states it and then grades against it.
export default function MarketingRulebookPage() {
  return (
    <>
      <section className="dark py-32 pb-24 bg-[radial-gradient(ellipse_at_12%_18%,rgba(8,174,170,0.45)_0%,transparent_52%),radial-gradient(ellipse_at_88%_88%,rgba(248,185,61,0.32)_0%,transparent_48%),linear-gradient(155deg,#0C4E6B_0%,#082A3B_60%)]">
        <div className="container">
          <div className="sec-head reveal">
            <h2 className="m-0 font-extrabold tracking-[-0.01em] leading-[1.18] text-[clamp(28px,3.8vw,46px)]">
              The Rulebook
            </h2>
            <p className="lead">
              Thirteen rules per framework. Every trade our members journal is graded against them,
              and Gavo checks what it can against real broker price data. Here it is in full, before
              you pay us anything.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container max-w-4xl">
          <RulebookView marketing />
        </div>
      </section>

      <section className="section pt-0">
        <div className="container">
          <CTACard
            heading="Get graded against it"
            sub="Journal a trade and Gavo reviews it against these rules, checking what it can against real broker price data."
            primaryLabel="Start free"
            primaryHref="/signup"
          />
        </div>
      </section>
    </>
  );
}
