/**
 * Shared by the pricing page's FAQ accordion and its FAQPage structured data.
 *
 * This lives in its own module rather than in PricingContent.tsx because that
 * file is "use client". A server component importing a value out of a client
 * module receives a client-reference proxy rather than the value itself, so
 * `FAQ_ITEMS.map(...)` threw "items.map is not a function" on the server and
 * took the whole page's server render down with it.
 */
export const PRICING_FAQ = [
  {
    q: "Can I pay in Kwacha?",
    a: "Yes, all prices have a ZMW equivalent. Payments are processed via Airtel Money, MTN MoMo, Zamtel Kwacha, or card.",
  },
  {
    q: "Is there a free trial for Pro?",
    a: "Not currently. The Starter plan is free forever and gives you access to all the core tools. Upgrade when the limits become a constraint.",
  },
  {
    q: "What frameworks does the platform support?",
    a: "SMC (Smart Money Concepts) and Supply & Demand. You choose your framework during onboarding, and all tools (the validator, alerts, and journal) reflect your choice.",
  },
  {
    q: "Can I cancel at any time?",
    a: "Yes. No contracts, no lock-ins. Cancel from your account settings and you keep access until the end of your billing period.",
  },
  {
    q: "What is the 1-on-1 mentorship?",
    a: "Pro members get monthly private sessions with Kondwani. He reviews your journal, identifies patterns, and gives you a personalised improvement plan.",
  },
  {
    q: "Do annual plans cost less?",
    a: "Yes, annual billing saves 20% on all paid plans.",
  },
] as const;
