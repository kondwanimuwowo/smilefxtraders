"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/learn", label: "Academy" },
  { href: "/our-community", label: "Community" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

function BrandLogo({ scrolled }: { scrolled: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={scrolled ? "/smile-logo.png" : "/Smile%20FX%20Traders%20Logo%20bg-W.png"}
      alt="Smile FX Traders"
      width={38}
      height={38}
      style={{ borderRadius: 10, objectFit: "contain", display: "block" }}
    />
  );
}

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isHeroDark = true; // marketing pages always start dark

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const headerClass = [
    "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
    scrolled
      ? "bg-white/86 backdrop-blur-md shadow-sm"
      : isHeroDark
      ? "on-dark"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <header
        className={headerClass}
        style={{
          background: scrolled ? "rgba(255,255,255,0.86)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          boxShadow: scrolled ? "0 2px 8px rgba(11,66,93,0.06)" : "none",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div className="mx-auto px-7" style={{ maxWidth: "var(--container, 1200px)" }}>
          <div
            className="flex items-center gap-7"
            style={{ height: scrolled ? "62px" : "72px", transition: "height 0.3s" }}
          >
            {/* Brand */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0">
              <BrandLogo scrolled={scrolled} />
              <div>
                <div
                  className="font-display font-bold text-[19px] leading-none tracking-tight"
                  style={{
                    color: scrolled ? "var(--ink)" : "#fff",
                    transition: "color 0.3s",
                  }}
                >
                  Smile FX
                </div>
                <div className="text-[9px] uppercase tracking-widest font-bold text-teal mt-0.5">
                  Traders
                </div>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 ml-2">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="px-3.5 py-2 rounded-lg text-[14.5px] font-medium transition-all duration-200 hover:bg-black/5"
                  style={{
                    color:
                      pathname === n.href
                        ? scrolled
                          ? "var(--teal-dark)"
                          : "var(--teal-bright)"
                        : scrolled
                        ? "var(--ink-mid)"
                        : "rgba(255,255,255,0.78)",
                  }}
                >
                  {n.label}
                </Link>
              ))}
            </nav>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-2.5 ml-auto">
              <Link
                href="/login"
                className="text-[14px] font-semibold px-3 py-2 rounded-full transition-colors"
                style={{ color: scrolled ? "var(--ink-mid)" : "rgba(255,255,255,0.8)" }}
              >
                Log in
              </Link>
              <Button href="/signup" size="lg" iconRight="arrow_forward">
                Start free
              </Button>
            </div>

            {/* Mobile hamburger */}
            <button
              type="button"
              className="md:hidden ml-auto p-1.5 rounded-lg"
              style={{ color: scrolled ? "var(--ink)" : "rgba(255,255,255,0.9)" }}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              <span className="material-symbols-rounded text-[24px]">
                {mobileOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile full-screen nav */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-60 flex flex-col p-6"
          style={{ background: "var(--navy-deep, #082A3B)" }}
        >
          <div className="flex items-center justify-between mb-7">
            <Link href="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
              <BrandLogo scrolled={false} />
              <div
                className="font-display font-bold text-[19px] text-white leading-none"
              >
                Smile FX
              </div>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-white/80"
            >
              <span className="material-symbols-rounded text-[24px]">close</span>
            </button>
          </div>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="font-display text-[26px] font-semibold py-3.5 border-b border-white/10 text-white/86 hover:text-teal-bright transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {n.label}
            </Link>
          ))}
          <div className="flex flex-col gap-3 mt-7">
            <Button
              href="/login"
              variant="ghost"
              size="lg"
              fullWidth
              onClick={() => setMobileOpen(false)}
              style={{ color: "#fff", borderColor: "rgba(255,255,255,0.25)" }}
            >
              Log in
            </Button>
            <Button
              href="/signup"
              size="lg"
              fullWidth
              onClick={() => setMobileOpen(false)}
            >
              Start free
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
