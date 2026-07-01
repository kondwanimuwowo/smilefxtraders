"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingScripts } from "@/components/marketing/MarketingScripts";
import "./marketing.css";

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

  return (
    <div className="marketing-theme">
      <MarketingScripts />
      <MarketingNav />
      {children}
      <MarketingFooter />
    </div>
  );
}
