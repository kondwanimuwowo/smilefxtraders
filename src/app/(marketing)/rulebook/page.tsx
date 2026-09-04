import type { Metadata } from "next";
import { MarketingRulebook } from "@/components/rulebook/MarketingRulebook";
import { CTACard } from "@/components/marketing/CTACard";
import { RULEBOOK, allRules } from "@/lib/rulebook";
import { isWaitlistMode } from "@/lib/site-gate";

const TITLE = "The Rulebook";
const DESCRIPTION =
  "The rules every Smile FX Traders setup is graded against, for Smart Money Concepts and Supply & Demand. Published in full, before you join.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/rulebook" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    // No explicit images here: an explicit openGraph.images beats the
    // opengraph-image.png file convention, and this page has its own
    // purpose-made card sitting next to it in the route folder.
  },
};

/**
 * Structured data for the rules themselves.
 *
 * An ItemList of rule titles rather than an FAQPage: these are not questions,
 * and claiming a schema that does not fit the content is the kind of thing that
 * earns a manual penalty. Built from RULEBOOK so it cannot fall out of step
 * with what the page renders.
 */
function ruleListJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "The Smile FX Traders Rulebook",
    description: DESCRIPTION,
    author: { "@type": "Organization", name: "Smile FX Traders" },
    publisher: { "@type": "Organization", name: "Smile FX Traders" },
    about: Object.values(RULEBOOK).map((book) => ({
      "@type": "ItemList",
      name: `${book.label} rulebook`,
      numberOfItems: allRules(book.framework).length,
      itemListElement: allRules(book.framework).map((rule) => ({
        "@type": "ListItem",
        position: rule.n,
        name: rule.title,
        description: rule.body,
      })),
    })),
  };
}

// Published rather than teased. The rulebook is the most concrete thing the
// platform can show a prospect: most competitors describe their edge, this
// states it and then grades against it.
export default function MarketingRulebookPage() {
  const waitlistMode = isWaitlistMode();
  return (
    <>
      <script
        type="application/ld+json"
        // Serialised from our own data, no user input anywhere in it.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ruleListJsonLd()) }}
      />

      <section className="dark py-32 pb-24 bg-[radial-gradient(ellipse_at_12%_18%,rgba(8,174,170,0.45)_0%,transparent_52%),radial-gradient(ellipse_at_88%_88%,rgba(248,185,61,0.32)_0%,transparent_48%),linear-gradient(155deg,#0C4E6B_0%,#082A3B_60%)]">
        <div className="container">
          <div className="sec-head reveal">
            <span className="eyebrow">Published in full</span>
            <h1 className="m-0 font-extrabold tracking-[-0.01em] leading-[1.18] text-[clamp(28px,3.8vw,46px)]">
              The Rulebook
            </h1>
            <p className="lead">
              Fourteen rules per framework, thirteen of them required and one optional confluence. Every trade our members journal is graded against them,
              and Gavo checks what it can against real broker price data. Here it is in full, before
              you pay us anything.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container max-w-[900px]">
          <MarketingRulebook />
        </div>
      </section>

      <section className="section soft">
        <div className="container">
          <CTACard
            heading="Get graded against it"
            sub={waitlistMode ? "We're launching soon — join the waitlist to be first in." : "Journal a trade and Gavo reviews it against these rules, checking what it can against real broker price data."}
            primaryLabel={waitlistMode ? "Join the waitlist" : "Start free"}
            primaryHref={waitlistMode ? "/waitlist" : "/signup"}
          />
        </div>
      </section>
    </>
  );
}
