import type { Metadata } from "next";
import { getPlanPrices } from "@/lib/server/getPlanPrices";
import { PricingContent } from "./PricingContent";
import { PRICING_FAQ } from "@/lib/pricing-faq";
import { JsonLd } from "@/components/marketing/JsonLd";
import { faqSchema, breadcrumbSchema } from "@/lib/seo";

export const revalidate = 300; // re-fetch prices every 5 min

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Plans that grow with you, from a free Starter tier to Pro with one-on-one mentorship. Every price shown in Zambian Kwacha and USD, paid by Airtel Money, MTN MoMo, Zamtel Kwacha or card.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    url: "/pricing",
    title: "Pricing | Smile FX Traders",
    description:
      "Start free and upgrade when the limits become a constraint. Kwacha and USD pricing, mobile money accepted, cancel any time.",
  },
};

export default async function PricingPage() {
  const prices = await getPlanPrices();
  return (
    <>
      {/* The FAQ is the part of this page an answer engine is most likely to
          quote, so it ships as schema as well as as an accordion. Both read the
          same PRICING_FAQ array, so the two can never disagree. */}
      <JsonLd data={faqSchema(PRICING_FAQ)} />
      <JsonLd data={breadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Pricing", path: "/pricing" },
      ])} />
      <PricingContent prices={prices} />
    </>
  );
}
