"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingScripts } from "@/components/marketing/MarketingScripts";
import { JsonLd } from "@/components/marketing/JsonLd";
import { organizationSchema } from "@/lib/seo";
import { SOCIAL_LINKS } from "@/lib/social-links";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // Only real profiles go into sameAs. A placeholder "#" would assert a
  // profile that does not exist, which is exactly the kind of claim that makes
  // an engine distrust the rest of the entity.
  const socialUrls = SOCIAL_LINKS
    .map((s) => s.href)
    .filter((href) => href.startsWith("http"));

  return (
    <div className="marketing-theme">
      <JsonLd data={organizationSchema(socialUrls)} />
      <MarketingScripts />
      <MarketingNav />
      {children}
      <MarketingFooter />
    </div>
  );
}
