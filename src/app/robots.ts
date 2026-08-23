import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Served at /robots.txt on both hosts. The disallow list names the app's own
 * paths rather than a host, so it stays correct whether a crawler arrives at
 * the apex or at app.smilefxtraders.com.
 *
 * AI crawlers are allowed on purpose. They are how a trader asking an assistant
 * "where can I learn SMC in Zambia" gets an answer that includes this site, and
 * blocking them removes the site from that answer without removing it from
 * anyone's training data. The private paths below are closed to every agent
 * equally, so allowing the crawlers costs nothing that matters.
 */
const PRIVATE_PATHS = [
  "/api/",
  "/dashboard",
  "/journal",
  "/validator",
  "/alerts",
  "/community",
  "/academy",
  "/trend",
  "/calendar",
  "/cot",
  "/macroedge",
  "/sessions",
  "/fx-orders",
  "/pair/",
  "/pairs",
  "/profile",
  "/settings",
  "/membership",
  "/notifications",
  "/admin",
  "/checkout",
  "/onboarding",
  "/login",
  "/signup",
  "/reset-password",
  "/forgot-password",
  "/auth/",
];

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "cohere-ai",
  "Bytespider",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PRIVATE_PATHS,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
