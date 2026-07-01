"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
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

  // Check auth state client-side
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setAuthed(!!s));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: scrolled ? "rgba(255,255,255,0.88)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          boxShadow: scrolled ? "0 2px 8px rgba(11,66,93,0.06)" : "none",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
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
              <BrandLogo scrolled={scrolled} />
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 19,
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                    color: scrolled ? "var(--ink)" : "#fff",
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
            <nav style={{ display: "flex", alignItems: "center", gap: 2, marginRight: 20 }} className="hidden md:flex">
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
            <div className="hidden md:flex" style={{ alignItems: "center", gap: 8 }}>
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

            {/* Mobile hamburger */}
            <button
              type="button"
              className="md:hidden"
              style={{
                marginLeft: 12,
                padding: 6,
                borderRadius: 8,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: scrolled ? "var(--ink)" : "rgba(255,255,255,0.9)",
              }}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 24 }}>
                {mobileOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile full-screen nav */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[60] flex flex-col p-6"
          style={{ background: "var(--navy-deep, #082A3B)" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }} onClick={() => setMobileOpen(false)}>
              <BrandLogo scrolled={false} />
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, color: "#fff", lineHeight: 1 }}>
                Smile FX
              </div>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              style={{ padding: 6, borderRadius: 8, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.8)" }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 24 }}>close</span>
            </button>
          </div>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.86)", textDecoration: "none", display: "block" }}
              onClick={() => setMobileOpen(false)}
            >
              {n.label}
            </Link>
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 28 }}>
            {authed ? (
              <Button href="/dashboard" size="lg" fullWidth onClick={() => setMobileOpen(false)} iconRight="arrow_forward">
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button href="/login" variant="ghost" size="lg" fullWidth onClick={() => setMobileOpen(false)} style={{ color: "#fff", borderColor: "rgba(255,255,255,0.25)" }}>
                  Log in
                </Button>
                <Button href="/signup" size="lg" fullWidth onClick={() => setMobileOpen(false)}>
                  Start free
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
