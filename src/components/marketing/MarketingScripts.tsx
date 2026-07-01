"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function MarketingScripts() {
  const pathname = usePathname();

  useEffect(() => {
    // 1. Reveal Animations
    document.documentElement.classList.add("reveal-ready");
    const reveals = Array.from(document.querySelectorAll(".reveal"));

    const showEl = (el: Element) => {
      const htmlEl = el as HTMLElement;
      const d = htmlEl.dataset.delay ? parseFloat(htmlEl.dataset.delay) : 0;
      setTimeout(() => el.classList.add("in"), d);
    };

    // Reveal anything already in the initial viewport right away
    const vh = window.innerHeight || 800;
    reveals.forEach((el) => {
      if (el.getBoundingClientRect().top < vh * 0.92) {
        el.classList.add("in");
      }
    });

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              showEl(e.target);
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
      );
      reveals.forEach((el) => {
        if (!el.classList.contains("in")) io.observe(el);
      });
    } else {
      reveals.forEach((el) => el.classList.add("in"));
    }
    
    // Failsafe: never leave content hidden if IO never fires
    const failsafe = setTimeout(() => {
      reveals.forEach((el) => el.classList.add("in"));
    }, 2200);

    // 2. Stat Counters
    const counters = document.querySelectorAll("[data-count]");
    let cio: IntersectionObserver;
    if (counters.length && "IntersectionObserver" in window) {
      cio = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const el = e.target as HTMLElement;
            const target = parseFloat(el.dataset.count || "0");
            const dur = 1400;
            const t0 = performance.now();
            const dec = el.dataset.dec ? parseInt(el.dataset.dec) : 0;
            
            const step = (t: number) => {
              const p = Math.min((t - t0) / dur, 1);
              const eased = 1 - Math.pow(1 - p, 3);
              el.textContent = (target * eased).toLocaleString(undefined, {
                minimumFractionDigits: dec,
                maximumFractionDigits: dec,
              });
              if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
            cio.unobserve(el);
          });
        },
        { threshold: 0.5 }
      );
      counters.forEach((el) => cio.observe(el));
    }

    return () => {
      clearTimeout(failsafe);
      if (cio) cio.disconnect();
    };
  }, [pathname]); // Re-run when route changes

  return null;
}
