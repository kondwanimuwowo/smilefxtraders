"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { useStore } from "@/lib/store";
import type { AppUser } from "@/lib/store";
import { signoutAction } from "@/app/(auth)/actions";

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

const ADMIN_NAV: { section: string; items: NavItem[] } = {
  section: "Admin",
  items: [
    { href: "/admin",          icon: "monitoring",    label: "Platform Stats"  },
    { href: "/admin/students", icon: "manage_accounts", label: "Students"      },
    { href: "/admin/alerts",   icon: "campaign",      label: "Alerts Manager"  },
    { href: "/admin/academy",  icon: "edit_note",     label: "Course Builder"  },
  ],
};

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Dashboard",
    items: [{ href: "/dashboard", icon: "space_dashboard", label: "Dashboard" }],
  },
  {
    section: "Tools",
    items: [
      { href: "/journal",   icon: "menu_book",           label: "Trade Journal"    },
      { href: "/validator", icon: "checklist",            label: "Rules Validator"  },
      { href: "/trend",     icon: "trending_up",          label: "Trend Matrix"     },
      { href: "/calendar",  icon: "event",               label: "Economic Calendar" },
      { href: "/sessions",   icon: "schedule",              label: "Market Sessions"  },
      { href: "/cot",       icon: "bar_chart",            label: "COT Reports"      },
      { href: "/fx-orders", icon: "candlestick_chart",    label: "FX Option Expiries" },
      { href: "/pairs",     icon: "currency_exchange",    label: "Pair Overviews"   },
    ],
  },
  {
    section: "Community",
    items: [
      { href: "/alerts",    icon: "notifications_active", label: "Setup Alerts" },
      { href: "/community", icon: "groups",               label: "Community"    },
      { href: "/academy",   icon: "school",               label: "Academy"      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, mobileSidebarOpen, setMobileSidebarOpen } = useStore();
  const isInstructor = user?.role === "instructor";
  const nav = isInstructor ? [...NAV, ADMIN_NAV] : NAV;
  const [pending, startTransition] = useTransition();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const fn = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (!e.matches) setMobileSidebarOpen(false);
    };
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [setMobileSidebarOpen]);

  function handleSignout() {
    startTransition(async () => { await signoutAction(); });
  }

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "?";

  const planLabel =
    user?.plan === "funded" ? "Funded Track" :
    user?.plan === "pro"    ? "Pro Trader"   : "Starter";

  // Mobile: full-width drawer, labels always visible (never collapsed)
  // Desktop: collapsible icon-rail
  const effectiveCollapsed = isMobile ? false : collapsed;

  return (
    <>
      {/* ── Backdrop — mobile only ───────────────────────────────────────────── */}
      {isMobile && (
        <div
          className="fixed inset-0 z-40 transition-[opacity,visibility]"
          style={{
            background: "rgba(7,33,46,0.55)",
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
            opacity: mobileSidebarOpen ? 1 : 0,
            visibility: mobileSidebarOpen ? "visible" : "hidden",
            transitionDuration: "280ms",
          }}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/*
       * Desktop: static in-flow sidebar (hidden below md via CSS, never fixed).
       * Mobile:  fixed overlay drawer; 'hidden md:flex' hides it pre-JS so there
       *          is no SSR flash. Once JS runs, isMobile=true adds display:flex
       *          inline to override 'hidden', and the transform slides it in/out.
       */}
      <aside
        className="hidden md:flex flex-col h-full border-r overflow-hidden shrink-0"
        style={isMobile ? {
          display: "flex",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          width: 280,
          zIndex: 50,
          transform: mobileSidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 280ms var(--ease-app)",
          background: "var(--sidebar)",
          borderColor: "var(--line)",
          boxShadow: mobileSidebarOpen ? "8px 0 40px rgba(0,0,0,0.25)" : "none",
        } : {
          width: collapsed ? 64 : 220,
          transition: "width 260ms var(--ease-app)",
          background: "var(--sidebar)",
          borderColor: "var(--line)",
        }}
      >
        {/* ── Header (pinned) ─────────────────────────────────────────────────── */}
        <div
          className="shrink-0 flex items-center border-b"
          style={{
            height: 56,
            borderColor: "var(--line)",
            padding: "0 14px",
            justifyContent: effectiveCollapsed ? "center" : "space-between",
            transition: "justify-content 260ms var(--ease-app)",
          }}
        >
          {/* Brand block */}
          <div
            className="flex items-center gap-2.5 overflow-hidden"
            style={{
              opacity: effectiveCollapsed ? 0 : 1,
              maxWidth: effectiveCollapsed ? 0 : 180,
              transition: "opacity 180ms var(--ease-app), max-width 260ms var(--ease-app)",
            }}
          >
            <BrandMark />
            <div style={{ whiteSpace: "nowrap" }}>
              <div className="font-display font-700 text-sm leading-none" style={{ color: "var(--ink-strong)" }}>
                Smile FX
              </div>
              <div className="text-[10px] font-semibold tracking-widest uppercase mt-0.5" style={{ color: "var(--teal)" }}>
                TRADERS
              </div>
            </div>
          </div>

          {/* Mobile: X close button. Desktop: chevron collapse toggle. */}
          {isMobile ? (
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="shrink-0 flex items-center justify-center rounded-xl transition-colors hover:bg-[var(--hover)]"
              style={{ width: 34, height: 34, color: "var(--ink-mid)" }}
              aria-label="Close menu"
            >
              <span className="material-symbols-rounded text-[20px]">close</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="shrink-0 flex items-center justify-center rounded-lg transition-colors"
              style={{ width: 28, height: 28, color: "var(--ink-dim)", background: "transparent" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(8,174,170,0.1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <span className="material-symbols-rounded text-[18px]">
                {collapsed ? "chevron_right" : "chevron_left"}
              </span>
            </button>
          )}
        </div>

        {/* ── Nav (scrollable) ────────────────────────────────────────────────── */}
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll"
          style={{ padding: effectiveCollapsed ? "12px 8px" : "12px 10px" }}
        >
          {nav.map(({ section, items }) => (
            <div key={section} className="mb-4">
              {!effectiveCollapsed && (
                <div
                  className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: "var(--ink-dim)" }}
                >
                  {section}
                </div>
              )}
              {effectiveCollapsed && <div style={{ height: 8 }} />}
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={pathname === item.href}
                    collapsed={effectiveCollapsed}
                    onNavigate={isMobile ? () => setMobileSidebarOpen(false) : undefined}
                  />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── Footer (pinned) ─────────────────────────────────────────────────── */}
        <div
          className="shrink-0 border-t overflow-x-hidden"
          style={{ borderColor: "var(--line)", padding: effectiveCollapsed ? "8px" : "8px 10px" }}
        >
          {user && (
            <ProfileButton
              user={user}
              isInstructor={isInstructor}
              initials={initials}
              planLabel={planLabel}
              collapsed={effectiveCollapsed}
              onSignout={handleSignout}
              signingOut={pending}
            />
          )}
        </div>
      </aside>
    </>
  );
}

// ── ProfileButton ────────────────────────────────────────────────────────────

const DROPUP_LINKS = [
  { href: "/profile",  icon: "person",            label: "Profile"    },
  { href: "/settings", icon: "settings",          label: "Settings"   },
  { href: "/pricing",  icon: "workspace_premium", label: "Membership" },
];

function ProfileButton({
  user, isInstructor, initials, planLabel, collapsed, onSignout, signingOut,
}: {
  user: AppUser;
  isInstructor: boolean;
  initials: string;
  planLabel: string;
  collapsed: boolean;
  onSignout: () => void;
  signingOut: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Recalculate position on open
  function toggle() {
    if (!open) setMenuRect(triggerRef.current?.getBoundingClientRect() ?? null);
    setOpen((v) => !v);
  }

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  const avatarStyle = isInstructor
    ? { background: "linear-gradient(135deg, var(--gold), #e09b25)", color: "var(--navy-deep)" }
    : { background: "linear-gradient(135deg, var(--teal), var(--navy))", color: "#fff" };

  const subline = isInstructor
    ? "Lead Instructor"
    : `@${user.handle.replace(/^@/, "")} · ${planLabel}`;

  const sublineColor = isInstructor ? "var(--gold)" : "var(--ink-dim)";

  const menuWidth = 220;

  return (
    <>
      {/* ── Trigger button ── */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        className="nav-tip w-full flex items-center rounded-xl transition-colors hover:bg-[var(--hover)]"
        style={{
          padding: collapsed ? "7px 0" : "7px 8px",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : 9,
          transition: "padding 260ms var(--ease-app)",
          background: open ? "var(--hover)" : "transparent",
        }}
        data-tip={collapsed ? user.name : undefined}
        aria-label="Account menu"
        aria-expanded={open}
      >
        <div
          className="size-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
          style={avatarStyle}
        >
          {initials}
        </div>

        <div
          style={{
            opacity: collapsed ? 0 : 1,
            maxWidth: collapsed ? 0 : 140,
            overflow: "hidden",
            transition: "opacity 180ms var(--ease-app), max-width 260ms var(--ease-app)",
            whiteSpace: "nowrap",
            textAlign: "left",
            flex: 1,
          }}
        >
          <div className="text-[12px] font-semibold truncate" style={{ color: "var(--ink-strong)" }}>
            {user.name}
          </div>
          <div className="text-[10px] truncate" style={{ color: sublineColor }}>
            {subline}
          </div>
        </div>

        {!collapsed && (
          <span
            className="material-symbols-rounded shrink-0"
            style={{
              fontSize: 15,
              color: "var(--ink-dim)",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 200ms var(--ease-app)",
            }}
          >
            expand_less
          </span>
        )}
      </button>

      {/* ── Dropup — portal so the sidebar's overflow-hidden doesn't clip it ── */}
      {open && menuRect && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          className="rounded-xl overflow-hidden"
          style={{
            position: "fixed",
            bottom: window.innerHeight - menuRect.top + 8,
            left: menuRect.left,
            width: menuWidth,
            background: "var(--panel)",
            border: "1px solid var(--line)",
            boxShadow: "0 -12px 40px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.15)",
            zIndex: 9999,
          }}
        >
          {/* Identity header */}
          <div
            className="flex items-center gap-2.5 px-3.5 py-3"
            style={{ borderBottom: "1px solid var(--line)" }}
          >
            <div
              className="size-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
              style={avatarStyle}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold truncate" style={{ color: "var(--ink-strong)" }}>
                {user.name}
              </div>
              <div className="text-[11px] truncate" style={{ color: sublineColor }}>
                {subline}
              </div>
            </div>
          </div>

          {/* Nav links */}
          {DROPUP_LINKS.map(({ href, icon, label }) => (
            <button
              key={href}
              type="button"
              onClick={() => navigate(href)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium transition-colors hover:bg-[var(--hover)]"
              style={{ color: "var(--ink-strong)" }}
            >
              <span className="material-symbols-rounded text-[17px]" style={{ color: "var(--ink-dim)" }}>
                {icon}
              </span>
              {label}
            </button>
          ))}

          {/* Sign out */}
          <div style={{ borderTop: "1px solid var(--line)" }}>
            <button
              type="button"
              onClick={() => { setOpen(false); onSignout(); }}
              disabled={signingOut}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium transition-colors hover:bg-[var(--hover)]"
              style={{ color: "var(--coral)" }}
            >
              <span className="material-symbols-rounded text-[17px]">logout</span>
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ── NavLink ──────────────────────────────────────────────────────────────────

function NavLink({
  item, active, collapsed, onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <li className="nav-tip" data-tip={collapsed ? item.label : undefined}>
      <Link
        href={item.href}
        onClick={onNavigate}
        className="flex items-center rounded-xl text-sm font-medium transition-colors"
        style={{
          padding: collapsed ? "7px 0" : "8px 12px",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : 10,
          transition: "padding 260ms var(--ease-app), background 150ms, box-shadow 150ms",
          ...(active
            ? {
                background: "linear-gradient(135deg, rgba(8,174,170,0.22), rgba(8,174,170,0.08))",
                color: "var(--ink-strong)",
                boxShadow: "inset 0 0 0 1px rgba(8,174,170,0.3)",
              }
            : { color: "var(--ink-mid)" }),
        }}
      >
        <span
          className="material-symbols-rounded shrink-0"
          style={{
            fontSize: 20,
            fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
            color: active ? "var(--teal)" : "inherit",
          }}
        >
          {item.icon}
        </span>
        <span
          style={{
            opacity: collapsed ? 0 : 1,
            maxWidth: collapsed ? 0 : 200,
            overflow: "hidden",
            whiteSpace: "nowrap",
            transition: "opacity 180ms var(--ease-app), max-width 260ms var(--ease-app)",
          }}
        >
          {item.label}
        </span>
      </Link>
    </li>
  );
}

// ── BrandMark ────────────────────────────────────────────────────────────────

function BrandMark() {
  return (
    <div style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 8, overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Smile-FX-Traders-Logo-bg-G%20(2).png"
        alt="Smile FX Traders"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
}
