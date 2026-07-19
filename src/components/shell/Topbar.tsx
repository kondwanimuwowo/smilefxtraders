"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useStore } from "@/lib/store";
import { useMarkNotifsRead } from "@/lib/hooks/useNotifications";
import { Avatar, Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { SearchModal } from "@/components/search/SearchModal";
import { clampPosition } from "@/lib/hooks/useClampedPosition";

export function Topbar() {
  const { user, unreadCount } = useStore();
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
    <header className="flex items-center h-14 shrink-0 px-5 gap-4 sticky top-0 z-40 bg-topbar-bg backdrop-blur-[8px] shadow-sm">
      {/* Search — left-anchored, borderless */}
      <button
        type="button"
        onClick={openSearch}
        className="tap-target flex items-center gap-2 rounded-full pl-3 pr-2.5 py-1.5 text-[13px] font-medium transition-shadow hover:shadow-md bg-panel-2 text-ink-mid shadow-sm w-full max-w-[260px]"
      >
        <Icon name="search" size={16} />
        <span className="flex-1 text-left">Search</span>
        <kbd className="hidden sm:inline-flex items-center rounded px-1 text-[10px] bg-track text-ink-dim">
          ⌘K
        </kbd>
      </button>
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <ThemeToggle />

        <NotifBell />

        <div className="w-px h-5 mx-0.5 bg-line" />

        {/* User chip */}
        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-hover"
        >
          {user?.avatarUrl ? (
            <Avatar src={user.avatarUrl} name={user.name ?? "You"} size={28} />
          ) : (
            <div className="size-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-[linear-gradient(135deg,var(--teal),var(--navy))] text-white">
              {user?.name?.[0] ?? "Y"}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold leading-none text-ink-strong">
              You
            </div>
            <div className="text-[10px] leading-none mt-0.5 text-ink-dim">
              Level {user?.level ?? 1} · {user?.streak ?? 0}🔥
            </div>
          </div>
        </button>
      </div>
    </header>
  );
}

// ── NotifBell ─────────────────────────────────────────────────────────────────

const TONE_CONFIG: Record<string, { icon: string; textCls: string; bgCls: string }> = {
  teal:  { icon: "notifications_active", textCls: "text-teal",  bgCls: "bg-[rgba(8,174,170,0.1)]"  },
  gold:  { icon: "workspace_premium",    textCls: "text-gold",  bgCls: "bg-[rgba(248,185,61,0.1)]" },
  coral: { icon: "warning",              textCls: "text-coral", bgCls: "bg-[rgba(234,82,61,0.1)]"  },
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
        className={cn(
          "tap-target relative p-1.5 rounded-lg transition-colors hover:bg-hover flex items-center justify-center",
          open ? "text-ink-strong bg-hover" : "text-ink-mid"
        )}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Icon name="notifications" size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 size-2 rounded-full bg-coral animate-live" />
        )}
      </button>

      {open && rect && typeof document !== "undefined" && createPortal(
        <div
          ref={panelRef}
          className="rounded-2xl overflow-hidden w-[340px] max-w-[calc(100vw-16px)] bg-panel shadow-[0_8px_24px_rgba(0,0,0,0.26)] z-[9999]"
          style={{
            position: "fixed",
            ...clampPosition({ triggerRect: rect, width: 340, estimatedHeight: 420, align: "right" }),
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-panel-2">
            <span className="text-[13.5px] font-semibold text-ink-strong">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-coral text-white">
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markRead.mutate({ all: true })}
                className="text-[11.5px] font-semibold transition-colors hover:opacity-80 text-teal"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notif list */}
          {preview.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center px-4">
              <Icon name="notifications" size={28} className="mb-2 text-ink-dim" />
              <div className="text-[13px] text-ink-dim">No notifications yet</div>
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
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-hover",
                      i < preview.length - 1 && "border-b border-line",
                      n.unread && "bg-[rgba(8,174,170,0.03)]"
                    )}
                  >
                    <div className={cn("size-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", cfg.bgCls)}>
                      <Icon name={n.icon || cfg.icon} size={14} className={cfg.textCls} />
                    </div>
                    <div className="flex-1 min-w-0">
                      {n.title && (
                        <div className="text-[12.5px] font-semibold leading-snug text-ink-strong">
                          {n.title}
                        </div>
                      )}
                      <div className={cn("text-[12.5px] leading-snug", n.title ? "text-ink-mid" : "text-ink-strong")}>
                        {n.body}
                      </div>
                      <div className="text-[11px] mt-0.5 text-ink-dim">
                        {timeAgo(n.time)}
                      </div>
                    </div>
                    {n.unread && (
                      <div className="size-1.5 rounded-full mt-1.5 shrink-0 bg-teal" />
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
            className="flex items-center justify-center gap-1.5 py-3 text-[12.5px] font-semibold transition-colors hover:bg-hover bg-panel-2 text-teal"
          >
            See all notifications
            <Icon name="arrow_forward" size={15} />
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
    return <span className="inline-block p-1.5 rounded-lg w-8 h-8" />;
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="tap-target p-1.5 rounded-lg transition-colors hover:bg-hover flex items-center justify-center text-ink-mid"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Icon name={isDark ? "dark_mode" : "light_mode"} size={20} />
    </button>
  );
}
