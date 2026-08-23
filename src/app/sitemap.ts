import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/**
 * Only public marketing routes belong here. Every app route sits behind auth,
 * so listing one would send a crawler to a login redirect and spend crawl
 * budget on nothing.
 *
 * `/blog` and `/careers` are deliberately absent while they are placeholders.
 * A "coming soon" page that ranks is worse than one that does not, because it
 * becomes the result someone gets for a query it cannot answer. Add them here
 * the day they carry real content.
 *
 * priority is a hint about relative importance within this site, not a ranking
 * lever. The order below reflects what a first-time visitor most needs.
 */
const ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/",                changeFrequency: "weekly",  priority: 1.0 },
  { path: "/pricing",         changeFrequency: "monthly", priority: 0.9 },
  { path: "/features",        changeFrequency: "monthly", priority: 0.9 },
  { path: "/learn",           changeFrequency: "monthly", priority: 0.8 },
  { path: "/rulebook",        changeFrequency: "monthly", priority: 0.8 },
  { path: "/our-community",   changeFrequency: "monthly", priority: 0.7 },
  { path: "/about",           changeFrequency: "yearly",  priority: 0.6 },
  { path: "/contact",         changeFrequency: "yearly",  priority: 0.5 },
  { path: "/risk-disclosure", changeFrequency: "yearly",  priority: 0.3 },
  { path: "/terms",           changeFrequency: "yearly",  priority: 0.2 },
  { path: "/privacy",         changeFrequency: "yearly",  priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency,
    priority,
  }));
}
