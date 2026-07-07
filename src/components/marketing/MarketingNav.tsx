"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

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
      src={scrolled ? "/smile-fx-logo-wht-navy-bg.png" : "/smile-fx-logo-wht.png"}
      alt="Smile FX Traders"
      width={38}
      height={38}
      className="rounded-[10px] object-contain block"
    />
  );
}

// Hand-drawn inline SVG rather than an Icon/registry lookup, since the
// hamburger is the only way in to mobile nav and its open/close morph
// (three bars -> X) needs per-line rotate/opacity control the shared
// Icon component doesn't expose.
function MenuGlyph({ open, color }: { open: boolean; color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="block">
      <line
        x1="3" y1={open ? 11 : 6} x2="19" y2={open ? 11 : 6}
        stroke={color} strokeWidth="2" strokeLinecap="round"
        style={{
          transformOrigin: "11px 11px",
          transform: open ? "rotate(45deg)" : "none",
          transition: "transform 260ms var(--ease-app, cubic-bezier(0.16,1,0.3,1)), y 260ms var(--ease-app, cubic-bezier(0.16,1,0.3,1))",
        }}
      />
      <line
        x1="3" y1="11" x2="19" y2="11"
        stroke={color} strokeWidth="2" strokeLinecap="round"
        style={{ opacity: open ? 0 : 1, transition: "opacity 160ms var(--ease-app, cubic-bezier(0.16,1,0.3,1))" }}
      />
      <line
        x1="3" y1={open ? 11 : 16} x2="19" y2={open ? 11 : 16}
        stroke={color} strokeWidth="2" strokeLinecap="round"
        style={{
          transformOrigin: "11px 11px",
          transform: open ? "rotate(-45deg)" : "none",
          transition: "transform 260ms var(--ease-app, cubic-bezier(0.16,1,0.3,1)), y 260ms var(--ease-app, cubic-bezier(0.16,1,0.3,1))",
        }}
      />
    </svg>
  );
}

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  // Check auth state client-side
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setAuthed(!!s));
    return () => subscription.unsubscribe();
  }, []);

  const hamburgerColor = mobileOpen ? "#fff" : scrolled ? "var(--ink)" : "rgba(255,255,255,0.9)";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-[70] transition-[background,box-shadow] duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
          scrolled || mobileOpen ? "bg-[rgba(255,255,255,0.88)] backdrop-blur-[12px]" : "bg-transparent",
          scrolled && "shadow-[0_2px_8px_rgba(11,66,93,0.06)]"
        )}
      >
        <div className="max-w-[var(--container,1200px)] mx-auto px-5">
          <div className={cn("flex items-center transition-[height] duration-300", scrolled ? "h-[62px]" : "h-[72px]")}>
            {/* Brand */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 no-underline">
              <BrandLogo scrolled={scrolled || mobileOpen} />
              <div>
                <div className={cn(
                  "font-display font-bold text-[19px] leading-none tracking-[-0.02em] transition-colors duration-300",
                  scrolled || mobileOpen ? "text-ink" : "text-white"
                )}>
                  Smile FX
                </div>
                <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-teal mt-0.5">
                  Traders
                </div>
              </div>
            </Link>

            {/* Spacer — pushes nav links toward the right */}
            <div className="flex-1" />

            {/* Desktop nav — sits between spacer and CTA */}
            <nav className="hidden lg:flex items-center gap-0.5 mr-5">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "px-[13px] py-2 rounded-lg text-[14.5px] font-medium no-underline transition-all duration-200",
                    scrolled ? "hover:bg-[rgba(11,66,93,0.06)]" : "hover:bg-[rgba(255,255,255,0.08)]",
                    pathname === n.href
                      ? (scrolled ? "text-teal-dark" : "text-teal-bright")
                      : (scrolled ? "text-ink-mid" : "text-[rgba(255,255,255,0.78)]")
                  )}
                >
                  {n.label}
                </Link>
              ))}
            </nav>

            {/* CTA */}
            <div className="hidden lg:flex items-center gap-2">
              {authed ? (
                <Button href="/dashboard" hardNav size="lg" iconRight="arrow_forward">
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <a
                    href="/login"
                    className={cn(
                      "text-sm font-semibold px-3 py-2 rounded-full no-underline transition-colors duration-200",
                      scrolled ? "text-ink-mid" : "text-[rgba(255,255,255,0.8)]"
                    )}
                  >
                    Log in
                  </a>
                  <Button href="/signup" hardNav size="lg" iconRight="arrow_forward">
                    Start free
                  </Button>
                </>
              )}
            </div>

            {/* Mobile hamburger — inline SVG, no web-font dependency */}
            <button
              type="button"
              className="flex lg:hidden tap-target ml-3 p-1.5 rounded-lg bg-transparent border-none cursor-pointer items-center justify-center relative z-[80]"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              <MenuGlyph open={mobileOpen} color={hamburgerColor} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile full-screen nav — always mounted so open/close can animate;
          visibility toggled via opacity/transform + pointer-events. */}
      <div
        className="fixed inset-0 lg:hidden flex flex-col px-6 overflow-y-auto bg-[radial-gradient(ellipse_at_15%_12%,rgba(8,174,170,0.32)_0%,transparent_50%),radial-gradient(ellipse_at_90%_85%,rgba(248,185,61,0.18)_0%,transparent_48%),var(--navy-deep,#082A3B)] z-[65] pt-[calc(4.5rem+var(--safe-top))] pb-[calc(1.5rem+var(--safe-bottom))]"
        aria-hidden={!mobileOpen}
        style={{
          opacity: mobileOpen ? 1 : 0,
          transform: mobileOpen ? "translateY(0)" : "translateY(-12px)",
          visibility: mobileOpen ? "visible" : "hidden",
          transitionProperty: "opacity, transform, visibility",
          transitionDuration: "280ms, 280ms, 0s",
          transitionDelay: mobileOpen ? "0s, 0s, 0s" : "0s, 0s, 280ms",
          transitionTimingFunction: "var(--ease-app, cubic-bezier(0.16,1,0.3,1))",
        }}
      >
        <nav className="flex flex-col mt-2">
          {NAV.map((n, i) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "font-display text-[25px] font-semibold py-4 px-1 border-b border-[rgba(255,255,255,0.1)] no-underline flex items-center justify-between",
                  active ? "text-teal-bright" : "text-[rgba(255,255,255,0.9)]"
                )}
                style={{
                  opacity: mobileOpen ? 1 : 0,
                  transform: mobileOpen ? "translateX(0)" : "translateX(12px)",
                  transition: `opacity 320ms var(--ease-app, cubic-bezier(0.16,1,0.3,1)) ${60 + i * 45}ms, transform 320ms var(--ease-app, cubic-bezier(0.16,1,0.3,1)) ${60 + i * 45}ms`,
                }}
                onClick={() => setMobileOpen(false)}
              >
                {n.label}
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", active ? "bg-teal-bright shadow-[0_0_8px_var(--teal-bright)]" : "bg-transparent")} />
              </Link>
            );
          })}
        </nav>

        <div
          className="flex flex-col gap-3 mt-7"
          style={{
            opacity: mobileOpen ? 1 : 0,
            transform: mobileOpen ? "translateY(0)" : "translateY(8px)",
            transition: `opacity 320ms var(--ease-app, cubic-bezier(0.16,1,0.3,1)) ${60 + NAV.length * 45}ms, transform 320ms var(--ease-app, cubic-bezier(0.16,1,0.3,1)) ${60 + NAV.length * 45}ms`,
          }}
        >
          {authed ? (
            <Button href="/dashboard" hardNav size="lg" fullWidth onClick={() => setMobileOpen(false)} iconRight="arrow_forward">
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button href="/signup" hardNav size="lg" fullWidth onClick={() => setMobileOpen(false)}>
                Start free
              </Button>
              <Button
                href="/login"
                hardNav
                variant="ghost"
                size="lg"
                fullWidth
                onClick={() => setMobileOpen(false)}
                className="text-white border-[rgba(255,255,255,0.25)]"
              >
                Log in
              </Button>
            </>
          )}
        </div>

        <div className="flex-1" />

        <p
          className="text-xs text-[rgba(255,255,255,0.4)] text-center pb-2"
          style={{
            opacity: mobileOpen ? 1 : 0,
            transition: "opacity 320ms var(--ease-app, cubic-bezier(0.16,1,0.3,1)) 340ms",
          }}
        >
          Trade smart money. Together.
        </p>
      </div>
    </>
  );
}
