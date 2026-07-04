"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useStore } from "@/lib/store";
import { useMarkNotifsRead } from "@/lib/hooks/useNotifications";
import { Icon } from "@/components/ui";
import { SearchModal } from "@/components/search/SearchModal";
import { clampPosition } from "@/lib/hooks/useClampedPosition";
import type { PriceTick } from "@/app/api/prices/route";

const FALLBACK: PriceTick[] = [
  { sym: "EURUSD", price: "1.08642", chg: +0.34 },
  { sym: "GBPUSD", price: "1.27310", chg: -0.18 },
  { sym: "USDJPY", price: "155.420", chg: -0.21 },
  { sym: "USDCHF", price: "0.90520", chg: +0.12 },
  { sym: "AUDUSD", price: "0.64810", chg: +0.28 },
  { sym: "NZDUSD", price: "0.61245", chg: +0.52 },
  { sym: "USDCAD", price: "1.37650", chg: -0.09 },
  { sym: "XAUUSD", price: "2338.40", chg: +0.91 },
  { sym: "NAS100", price: "18742.5", chg: -0.27 },
  { sym: "DXY",    price: "104.27",  chg: -0.21 },
];

function useLivePrices() {
  const tickMap = useRef<Map<string, PriceTick>>(new Map(FALLBACK.map((t) => [t.sym, t])));
  const [ticks, setTicks] = useState<PriceTick[]>(FALLBACK);
  const [live,  setLive]  = useState(false);

  useEffect(() => {
    // REST fetch — loads prices + daily % change; refreshed every 5 min
    async function fetchRest() {
      try {
        const res = await fetch("/api/prices", { cache: "no-store" });
        if (!res.ok) return;
        const data: PriceTick[] = await res.json();
        if (!Array.isArray(data) || data.length === 0) return;
        data.forEach((t) => tickMap.current.set(t.sym, t));
        setTicks([...tickMap.current.values()]);
        setLive(true);
      } catch { /* keep fallback */ }
    }

    fetchRest();
    const restTimer = setInterval(fetchRest, 5 * 60_000);

    // SSE stream — server holds the Twelve Data WebSocket; pushes { sym, price } ticks
    const es = new EventSource("/api/prices/stream");

    es.onmessage = (e) => {
      try {
        const { sym, price } = JSON.parse(e.data as string) as { sym: string; price: string };
        const existing = tickMap.current.get(sym);
        if (existing) {
          tickMap.current.set(sym, { ...existing, price });
          setTicks([...tickMap.current.values()]);
          setLive(true);
        }
      } catch { /* ignore */ }
    };

    // EventSource reconnects automatically on error — no extra handling needed

    return () => {
      clearInterval(restTimer);
      es.close();
    };
  }, []);

  return { ticks, live };
}

export function Topbar() {
  const { user, unreadCount } = useStore();
  const { ticks, live } = useLivePrices();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

  const openSearch = useCallback(() => setSearchOpen(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); openSearch(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openSearch]);

  return (
    <header
      className="flex items-center h-[48px] shrink-0 px-5 gap-4 border-b sticky top-0 z-40"
      style={{
        background: "var(--topbar-bg)",
        borderColor: "var(--line)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      {/* Live price ticker */}
      <div className="flex-1 min-w-0 overflow-hidden relative">
        {/* Fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, var(--topbar-bg), transparent)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, var(--topbar-bg), transparent)" }} />

        <div className="flex items-center gap-3 md:gap-5 overflow-x-auto px-2" style={{ scrollbarWidth: "none" }}>
          {/* Live indicator dot */}
          {live && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className="size-1.5 rounded-full"
                style={{ background: "var(--teal)", animation: "var(--animate-live)" }}
              />
              <span className="text-[10px] font-semibold" style={{ color: "var(--teal)", letterSpacing: "0.05em" }}>LIVE</span>
            </div>
          )}

          {ticks.map((item) => (
            <div key={item.sym} className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold" style={{ color: "var(--ink-mid)" }}>{item.sym}</span>
              <span className="text-xs font-medium tabular-nums" style={{ color: "var(--ink-strong)" }}>
                {item.price}
              </span>
              <span
                className="text-[11px] font-medium tabular-nums"
                style={{ color: item.chg >= 0 ? "var(--teal-bright)" : "var(--coral-bright)" }}
              >
                {item.chg >= 0 ? "+" : ""}{item.chg}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Search */}
        <button
          type="button"
          onClick={openSearch}
          className="tap-target flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--bg-hover)]"
          style={{ background: "var(--panel-2)", color: "var(--ink-mid)", border: "1px solid var(--line)" }}
        >
          <Icon name="search" size={16} />
          <span className="hidden sm:inline">Search</span>
          <kbd
            className="hidden sm:inline-flex items-center rounded px-1 text-[10px]"
            style={{ background: "var(--track)", color: "var(--ink-dim)" }}
          >
            ⌘K
          </kbd>
        </button>
        {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}

        <ThemeToggle />

        <NotifBell />

        <div className="w-px h-5 mx-0.5" style={{ background: "var(--line)" }} />

        {/* User chip */}
        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-[var(--hover)]"
          style={{ background: "var(--panel-2)", border: "1px solid var(--line)" }}
        >
          <div
            className="size-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "linear-gradient(135deg, var(--teal), var(--navy))", color: "#fff" }}
          >
            {user?.name?.[0] ?? "Y"}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold leading-none" style={{ color: "var(--ink-strong)" }}>
              You
            </div>
            <div className="text-[10px] leading-none mt-0.5" style={{ color: "var(--ink-dim)" }}>
              Level {user?.level ?? 1} · {user?.streak ?? 0}🔥
            </div>
          </div>
        </button>
      </div>
    </header>
  );
}

// ── NotifBell ─────────────────────────────────────────────────────────────────

const TONE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  teal:  { icon: "notifications_active", color: "var(--teal)",  bg: "rgba(8,174,170,0.1)"  },
  gold:  { icon: "workspace_premium",    color: "var(--gold)",  bg: "rgba(248,185,61,0.1)" },
  coral: { icon: "warning",              color: "var(--coral)", bg: "rgba(234,82,61,0.1)"  },
};

import { fmtRelative } from "@/lib/date";
function timeAgo(iso: string): string { return fmtRelative(iso); }

function NotifBell() {
  const { unreadCount, notifs } = useStore();
  const markRead = useMarkNotifsRead();
  const [open, setOpen]     = useState(false);
  const [rect, setRect]     = useState<DOMRect | null>(null);
  const triggerRef          = useRef<HTMLButtonElement>(null);
  const panelRef            = useRef<HTMLDivElement>(null);

  function toggle() {
    if (!open) setRect(triggerRef.current?.getBoundingClientRect() ?? null);
    setOpen((v) => !v);
  }

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !panelRef.current?.contains(e.target as Node)
      ) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const preview = notifs.slice(0, 6);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        className="tap-target relative p-1.5 rounded-lg transition-colors hover:bg-[var(--hover)] flex items-center justify-center"
        style={{ color: open ? "var(--ink-strong)" : "var(--ink-mid)", background: open ? "var(--hover)" : undefined }}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Icon name="notifications" size={20} />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 size-2 rounded-full"
            style={{ background: "var(--coral)", animation: "var(--animate-live)" }}
          />
        )}
      </button>

      {open && rect && typeof document !== "undefined" && createPortal(
        <div
          ref={panelRef}
          className="rounded-2xl overflow-hidden"
          style={{
            position: "fixed",
            ...clampPosition({ triggerRect: rect, width: 340, estimatedHeight: 420, align: "right" }),
            width: 340,
            maxWidth: "calc(100vw - 16px)",
            background: "var(--panel)",
            border: "1px solid var(--line)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
            zIndex: 9999,
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--line)" }}
          >
            <span className="text-[13.5px] font-semibold" style={{ color: "var(--ink-strong)" }}>
              Notifications
              {unreadCount > 0 && (
                <span
                  className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: "var(--coral)", color: "#fff" }}
                >
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markRead.mutate({ all: true })}
                className="text-[11.5px] font-semibold transition-colors hover:opacity-80"
                style={{ color: "var(--teal)" }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notif list */}
          {preview.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center px-4">
              <span className="material-symbols-rounded mb-2" style={{ fontSize: 28, color: "var(--ink-dim)" }}>
                notifications
              </span>
              <div className="text-[13px]" style={{ color: "var(--ink-dim)" }}>No notifications yet</div>
            </div>
          ) : (
            <div>
              {preview.map((n, i) => {
                const cfg = TONE_CONFIG[n.tone] ?? TONE_CONFIG.teal;
                return (
                  <Link
                    key={n.id}
                    href={n.href ?? "/notifications"}
                    onClick={() => {
                      setOpen(false);
                      if (n.unread) markRead.mutate({ id: n.id });
                    }}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--hover)]"
                    style={{
                      borderTop: i > 0 ? "1px solid var(--line)" : undefined,
                      background: n.unread ? "rgba(8,174,170,0.03)" : undefined,
                    }}
                  >
                    <div
                      className="size-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: cfg.bg }}
                    >
                      <span
                        className="material-symbols-rounded"
                        style={{ fontSize: 14, color: cfg.color, fontVariationSettings: "'FILL' 1" }}
                      >
                        {n.icon || cfg.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {n.title && (
                        <div className="text-[12.5px] font-semibold leading-snug" style={{ color: "var(--ink-strong)" }}>
                          {n.title}
                        </div>
                      )}
                      <div
                        className="text-[12.5px] leading-snug"
                        style={{ color: n.title ? "var(--ink-mid)" : "var(--ink-strong)" }}
                      >
                        {n.body}
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: "var(--ink-dim)" }}>
                        {timeAgo(n.time)}
                      </div>
                    </div>
                    {n.unread && (
                      <div className="size-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "var(--teal)" }} />
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 py-3 text-[12.5px] font-semibold transition-colors hover:bg-[var(--hover)]"
            style={{ borderTop: "1px solid var(--line)", color: "var(--teal)" }}
          >
            See all notifications
            <span className="material-symbols-rounded" style={{ fontSize: 15 }}>arrow_forward</span>
          </Link>
        </div>,
        document.body
      )}
    </>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = theme === "dark";

  if (!mounted) {
    return <span className="inline-block p-1.5 rounded-lg" style={{ width: 32, height: 32 }} />;
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="tap-target p-1.5 rounded-lg transition-colors hover:bg-[var(--hover)] flex items-center justify-center"
      style={{ color: "var(--ink-mid)" }}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Icon name={isDark ? "dark_mode" : "light_mode"} size={20} />
    </button>
  );
}
