"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { navActiveIconStyle } from "@/lib/nav-active-style";

interface TabDef {
  href?: string;
  icon: string;
  label: string;
  isMore?: boolean;
}

const TABS: TabDef[] = [
  { href: "/dashboard", icon: "space_dashboard",       label: "Dashboard" },
  { href: "/journal",   icon: "menu_book",             label: "Journal"   },
  { href: "/alerts",    icon: "notifications_active",  label: "Alerts"    },
  { href: "/community", icon: "groups",                label: "Community" },
  { icon: "more_horiz", label: "More", isMore: true },
];

const PROMOTED_HREFS = TABS.filter((t) => t.href).map((t) => t.href!);

// Primary mobile nav — visible only below md (768px), matching Sidebar's own
// mobile breakpoint. "More" doesn't navigate; it opens the same off-canvas
// Sidebar drawer the (now-removed) Topbar hamburger used to trigger.
export function BottomTabBar() {
  const pathname = usePathname();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useStore();

  const isOnPromotedRoute = PROMOTED_HREFS.some(
    (href) => pathname === href || pathname.startsWith(href + "/"),
  );

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch pb-safe"
      style={{ background: "var(--sidebar)", borderTop: "1px solid var(--line)" }}
    >
      {TABS.map((tab) => {
        const active = tab.isMore ? mobileSidebarOpen || !isOnPromotedRoute
          : pathname === tab.href || pathname.startsWith(tab.href + "/");

        const content = (
          <>
            <span className="material-symbols-rounded" style={navActiveIconStyle(active, 22)}>
              {tab.icon}
            </span>
            <span
              className="text-[10px] font-medium leading-none mt-0.5"
              style={{ color: active ? "var(--teal)" : "var(--ink-mid)" }}
            >
              {tab.label}
            </span>
          </>
        );

        const className =
          "tap-target flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors";

        return tab.isMore ? (
          <button
            key="more"
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className={className}
            aria-label="More navigation"
          >
            {content}
          </button>
        ) : (
          <Link key={tab.href} href={tab.href!} className={className}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
