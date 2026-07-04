import type { Metadata } from "next";
import { getPlanPrices } from "@/lib/server/getPlanPrices";
import { PricingContent } from "./PricingContent";

export const revalidate = 300; // re-fetch prices every 5 min

export const metadata: Metadata = {
  title: "Pricing | Smile FX Traders",
  description: "Simple plans that grow with you, from a free Starter tier to the Funded Track with mentorship. Prices in USD and Zambian Kwacha.",
};

export default async function PricingPage() {
  const prices = await getPlanPrices();
  return <PricingContent prices={prices} />;
}
