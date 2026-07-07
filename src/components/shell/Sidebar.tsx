"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { useStore } from "@/lib/store";
import type { AppUser } from "@/lib/store";
import { signoutAction } from "@/app/(auth)/actions";
import { navActiveRowClass, navActiveIconClass } from "@/lib/nav-active-style";
import { clampPosition } from "@/lib/hooks/useClampedPosition";
import { cn } from "@/lib/cn";

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
    { href: "/admin/academy",      icon: "edit_note",     label: "Course Builder"   },
    { href: "/admin/instruments",  icon: "currency_exchange", label: "Instruments"    },
    { href: "/admin/pricing",      icon: "sell",              label: "Pricing"        },
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
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("smfx_sidebar") === "1"
  );
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
          className="fixed inset-0 z-40 transition-[opacity,visibility] bg-[rgba(7,33,46,0.55)] backdrop-blur-[3px]"
          style={{
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
        className="hidden md:flex flex-col h-full border-r overflow-hidden shrink-0 bg-sidebar border-line"
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
          boxShadow: mobileSidebarOpen ? "8px 0 40px rgba(0,0,0,0.25)" : "none",
        } : {
          width: collapsed ? 64 : 220,
          transition: "width 260ms var(--ease-app)",
        }}
      >
        {/* ── Header (pinned) ─────────────────────────────────────────────────── */}
        <div
          className="shrink-0 flex items-center border-b h-14 px-3.5 border-line"
          style={{
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
            <div className="whitespace-nowrap">
              <div className="font-display font-700 text-sm leading-none text-ink-strong">
                Smile FX
              </div>
              <div className="text-[10px] font-semibold tracking-widest uppercase mt-0.5 text-teal">
                TRADERS
              </div>
            </div>
          </div>

          {/* Mobile: X close button. Desktop: chevron collapse toggle. */}
          {isMobile ? (
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="shrink-0 flex items-center justify-center rounded-xl transition-colors hover:bg-hover size-[34px] text-ink-mid"
              aria-label="Close menu"
            >
              <span className="material-symbols-rounded text-[20px]">close</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCollapsed((c) => {
                const next = !c;
                localStorage.setItem("smfx_sidebar", next ? "1" : "0");
                return next;
              })}
              className="shrink-0 flex items-center justify-center rounded-lg transition-colors size-7 text-ink-dim bg-transparent hover:bg-[rgba(8,174,170,0.1)]"
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
                <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-dim">
                  {section}
                </div>
              )}
              {effectiveCollapsed && <div className="h-2" />}
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={pathname === item.href || (item.href !== "/" && item.href !== "/admin" && pathname.startsWith(item.href + "/"))}
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
          className="shrink-0 border-t overflow-x-hidden border-line"
          style={{ padding: effectiveCollapsed ? "8px" : "8px 10px" }}
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
  { href: "/membership", icon: "workspace_premium", label: "Membership" },
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

  const avatarCls = isInstructor
    ? "bg-[linear-gradient(135deg,var(--gold),#e09b25)] text-navy-deep"
    : "bg-[linear-gradient(135deg,var(--teal),var(--navy))] text-white";

  const subline = isInstructor
    ? "Lead Instructor"
    : `@${user.handle.replace(/^@/, "")} · ${planLabel}`;

  const sublineCls = isInstructor ? "text-gold" : "text-ink-dim";

  const menuWidth = 220;

  return (
    <>
      {/* ── Trigger button ── */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        className={cn("nav-tip w-full flex items-center rounded-xl transition-colors hover:bg-hover", open && "bg-hover")}
        style={{
          padding: collapsed ? "7px 0" : "7px 8px",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : 9,
          transition: "padding 260ms var(--ease-app)",
        }}
        data-tip={collapsed ? user.name : undefined}
        aria-label="Account menu"
        aria-expanded={open}
      >
        <div className={cn("size-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0", avatarCls)}>
          {initials}
        </div>

        <div
          className="overflow-hidden whitespace-nowrap text-left flex-1"
          style={{
            opacity: collapsed ? 0 : 1,
            maxWidth: collapsed ? 0 : 140,
            transition: "opacity 180ms var(--ease-app), max-width 260ms var(--ease-app)",
          }}
        >
          <div className="text-[12px] font-semibold truncate text-ink-strong">
            {user.name}
          </div>
          <div className={cn("text-[10px] truncate", sublineCls)}>
            {subline}
          </div>
        </div>

        {!collapsed && (
          <span
            className="material-symbols-rounded shrink-0 text-[15px] text-ink-dim"
            style={{
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
          className="rounded-xl overflow-hidden bg-panel border border-line shadow-[0_-12px_40px_rgba(0,0,0,0.3),0_4px_20px_rgba(0,0,0,0.15)] z-[9999]"
          style={{
            position: "fixed",
            ...clampPosition({ triggerRect: menuRect, width: menuWidth, estimatedHeight: 260, direction: "up" }),
            width: menuWidth,
          }}
        >
          {/* Identity header */}
          <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-line">
            <div className={cn("size-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0", avatarCls)}>
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold truncate text-ink-strong">
                {user.name}
              </div>
              <div className={cn("text-[11px] truncate", sublineCls)}>
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
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium transition-colors hover:bg-hover text-ink-strong"
            >
              <span className="material-symbols-rounded text-[17px] text-ink-dim">
                {icon}
              </span>
              {label}
            </button>
          ))}

          {/* Sign out */}
          <div className="border-t border-line">
            <button
              type="button"
              onClick={() => { setOpen(false); onSignout(); }}
              disabled={signingOut}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium transition-colors hover:bg-hover text-coral"
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
        className={cn(
          "flex items-center rounded-xl text-sm font-medium transition-colors",
          navActiveRowClass(active)
        )}
        style={{
          padding: collapsed ? "7px 0" : "8px 12px",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : 10,
          transition: "padding 260ms var(--ease-app), background 150ms, box-shadow 150ms",
        }}
      >
        <span className={cn("material-symbols-rounded shrink-0 text-[20px]", navActiveIconClass(active))}>
          {item.icon}
        </span>
        <span
          className="overflow-hidden whitespace-nowrap"
          style={{
            opacity: collapsed ? 0 : 1,
            maxWidth: collapsed ? 0 : 200,
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
    <div className="size-[34px] shrink-0 rounded-lg overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/smile-fx-logo-wht-navy-bg.png"
        alt="Smile FX Traders"
        className="w-full h-full object-contain"
      />
    </div>
  );
}
