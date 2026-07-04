"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
      src={scrolled ? "/smile-fx-logo-wht-navy-bg.png" : "/smile-fx-logo-wht.png"}
      alt="Smile FX Traders"
      width={38}
      height={38}
      style={{ borderRadius: 10, objectFit: "contain", display: "block" }}
    />
  );
}

// Inline SVG, not a web-font ligature — the hamburger is the only way in to
// mobile nav, so it must render even if the Material Symbols font is slow
// or blocked on a given connection. The three bars morph into an X on open.
function MenuGlyph({ open, color }: { open: boolean; color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ display: "block" }}>
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
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 70,
          background: scrolled || mobileOpen ? "rgba(255,255,255,0.88)" : "transparent",
          backdropFilter: scrolled || mobileOpen ? "blur(12px)" : "none",
          boxShadow: scrolled ? "0 2px 8px rgba(11,66,93,0.06)" : "none",
          transition: "background 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div style={{ maxWidth: "var(--container, 1200px)", margin: "0 auto", padding: "0 20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: scrolled ? "62px" : "72px",
              transition: "height 0.3s",
            }}
          >
            {/* Brand */}
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, textDecoration: "none" }}>
              <BrandLogo scrolled={scrolled || mobileOpen} />
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 19,
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                    color: scrolled || mobileOpen ? "var(--ink)" : "#fff",
                    transition: "color 0.3s",
                  }}
                >
                  Smile FX
                </div>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 700, color: "var(--teal)", marginTop: 2 }}>
                  Traders
                </div>
              </div>
            </Link>

            {/* Spacer — pushes nav links toward the right */}
            <div style={{ flex: 1 }} />

            {/* Desktop nav — sits between spacer and CTA */}
            <nav style={{ display: "flex", alignItems: "center", gap: 2, marginRight: 20 }} className="hidden lg:flex">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  style={{
                    padding: "8px 13px",
                    borderRadius: 8,
                    fontSize: 14.5,
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "all 0.2s",
                    color:
                      pathname === n.href
                        ? scrolled ? "var(--teal-dark)" : "var(--teal-bright)"
                        : scrolled ? "var(--ink-mid)" : "rgba(255,255,255,0.78)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = scrolled ? "rgba(11,66,93,0.06)" : "rgba(255,255,255,0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {n.label}
                </Link>
              ))}
            </nav>

            {/* CTA */}
            <div className="hidden lg:flex" style={{ alignItems: "center", gap: 8 }}>
              {authed ? (
                <Button href="/dashboard" size="lg" iconRight="arrow_forward">
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Link
                    href="/login"
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      padding: "8px 12px",
                      borderRadius: 99,
                      textDecoration: "none",
                      transition: "color 0.2s",
                      color: scrolled ? "var(--ink-mid)" : "rgba(255,255,255,0.8)",
                    }}
                  >
                    Log in
                  </Link>
                  <Button href="/signup" size="lg" iconRight="arrow_forward">
                    Start free
                  </Button>
                </>
              )}
            </div>

            {/* Mobile hamburger — inline SVG, no web-font dependency */}
            <button
              type="button"
              className="lg:hidden tap-target"
              style={{
                marginLeft: 12,
                padding: 6,
                borderRadius: 8,
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                zIndex: 80,
              }}
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
        className="fixed inset-0 lg:hidden flex flex-col px-6 overflow-y-auto"
        aria-hidden={!mobileOpen}
        style={{
          zIndex: 65,
          background: "radial-gradient(ellipse at 15% 12%, rgba(8,174,170,0.32) 0%, transparent 50%), radial-gradient(ellipse at 90% 85%, rgba(248,185,61,0.18) 0%, transparent 48%), var(--navy-deep, #082A3B)",
          paddingTop: "calc(4.5rem + var(--safe-top))",
          paddingBottom: "calc(1.5rem + var(--safe-bottom))",
          opacity: mobileOpen ? 1 : 0,
          transform: mobileOpen ? "translateY(0)" : "translateY(-12px)",
          visibility: mobileOpen ? "visible" : "hidden",
          transitionProperty: "opacity, transform, visibility",
          transitionDuration: "280ms, 280ms, 0s",
          transitionDelay: mobileOpen ? "0s, 0s, 0s" : "0s, 0s, 280ms",
          transitionTimingFunction: "var(--ease-app, cubic-bezier(0.16,1,0.3,1))",
        }}
      >
        <nav className="flex flex-col" style={{ marginTop: 8 }}>
          {NAV.map((n, i) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 25,
                  fontWeight: 600,
                  padding: "16px 4px",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  color: active ? "var(--teal-bright)" : "rgba(255,255,255,0.9)",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  opacity: mobileOpen ? 1 : 0,
                  transform: mobileOpen ? "translateX(0)" : "translateX(12px)",
                  transition: `opacity 320ms var(--ease-app, cubic-bezier(0.16,1,0.3,1)) ${60 + i * 45}ms, transform 320ms var(--ease-app, cubic-bezier(0.16,1,0.3,1)) ${60 + i * 45}ms`,
                }}
                onClick={() => setMobileOpen(false)}
              >
                {n.label}
                <span
                  style={{
                    width: 6, height: 6, borderRadius: 99,
                    background: active ? "var(--teal-bright)" : "transparent",
                    boxShadow: active ? "0 0 8px var(--teal-bright)" : "none",
                    flexShrink: 0,
                  }}
                />
              </Link>
            );
          })}
        </nav>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 28,
            opacity: mobileOpen ? 1 : 0,
            transform: mobileOpen ? "translateY(0)" : "translateY(8px)",
            transition: `opacity 320ms var(--ease-app, cubic-bezier(0.16,1,0.3,1)) ${60 + NAV.length * 45}ms, transform 320ms var(--ease-app, cubic-bezier(0.16,1,0.3,1)) ${60 + NAV.length * 45}ms`,
          }}
        >
          {authed ? (
            <Button href="/dashboard" size="lg" fullWidth onClick={() => setMobileOpen(false)} iconRight="arrow_forward">
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button href="/signup" size="lg" fullWidth onClick={() => setMobileOpen(false)}>
                Start free
              </Button>
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
            </>
          )}
        </div>

        <div style={{ flex: 1 }} />

        <p
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
            textAlign: "center",
            paddingBottom: 8,
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
