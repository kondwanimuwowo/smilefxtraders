/**
 * One source of truth for site-level SEO and structured data.
 *
 * Two audiences, not one. Search engines read the metadata and the sitemap;
 * answer engines (ChatGPT, Claude, Perplexity, Google's AI surfaces) lean much
 * harder on JSON-LD and on whether a claim is stated plainly enough to quote.
 * That is why the schema below is fuller than a classic SEO setup needs: an
 * answer engine asked "what does Smile FX Traders cost in Kwacha" should be
 * able to answer from the Offer nodes without guessing.
 */

const MARKETING_HOST = process.env.NEXT_PUBLIC_MARKETING_HOST ?? "smilefxtraders.com";

export const SITE_URL = `https://${MARKETING_HOST}`;

export const SITE = {
  name: "Smile FX Traders",
  /** Used as the fallback <title> and in schema. */
  tagline: "Trade Smart Money, Together",
  /**
   * The fallback meta description and the sentence most likely to be quoted
   * back by an answer engine. Written to survive being read out of context:
   * who it is for, what it does, and where it is, in one sentence.
   */
  description:
    "A professional trading desk for forex traders using Smart Money Concepts and Supply & Demand. Journal every trade, validate setups against a 14-rule checklist before entry, follow live calls, and learn the method from first principles. Built in Zambia, priced in Kwacha and USD.",
  locale: "en_ZM",
  email: "support@smilefxtraders.com",
  foundingLocation: "Lusaka, Zambia",
} as const;

/** Absolute URL for a marketing path. Schema and OG tags must not use relative paths. */
export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

// ── Structured data ───────────────────────────────────────────────────────────

/**
 * Organization + WebSite, emitted once from the marketing layout.
 *
 * `sameAs` is the link between this site and its social profiles, and it is how
 * an engine decides two mentions are the same entity. Placeholder hrefs are
 * filtered out at the call site rather than listed as "#", which would assert a
 * profile that does not exist.
 */
export function organizationSchema(socialUrls: string[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE.name,
        url: SITE_URL,
        email: SITE.email,
        description: SITE.description,
        logo: {
          "@type": "ImageObject",
          url: absoluteUrl("/smile-logo-dark.png"),
        },
        ...(socialUrls.length ? { sameAs: socialUrls } : {}),
        founder: {
          "@type": "Person",
          name: "Kondwani Muwowo",
          jobTitle: "Founder and Lead Instructor",
        },
        areaServed: { "@type": "Place", name: "Zambia" },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE.name,
        description: SITE.description,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en",
      },
    ],
  };
}

/** FAQPage. The one schema type answer engines quote from most directly. */
export function faqSchema(items: ReadonlyArray<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

/** BreadcrumbList, so an engine can place a page in the site rather than treat it as loose. */
export function breadcrumbSchema(trail: ReadonlyArray<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}
