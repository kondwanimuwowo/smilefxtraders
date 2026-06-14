"use client";

import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { useStore } from "@/lib/store";
import { Icon } from "@/components/ui";
import type { PriceTick } from "@/app/api/prices/route";

const FALLBACK: PriceTick[] = [
  { sym: "EURUSD", price: "1.08642", chg: +0.34 },
  { sym: "GBPUSD", price: "1.27310", chg: -0.18 },
  { sym: "NZDUSD", price: "0.61245", chg: +0.52 },
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
  const { user, unreadCount, setMobileSidebarOpen } = useStore();
  const { ticks, live } = useLivePrices();

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
      {/* Hamburger — mobile only */}
      <button
        type="button"
        className="md:hidden shrink-0 p-1.5 rounded-lg transition-colors hover:bg-[var(--hover)]"
        style={{ color: "var(--ink-mid)" }}
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Icon name="menu" size={22} />
      </button>
      <div className="md:hidden w-px h-5 shrink-0" style={{ background: "var(--line)" }} />

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
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
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

        <ThemeToggle />

        {/* Notifications */}
        <button
          type="button"
          className="relative p-1.5 rounded-lg transition-colors hover:bg-[var(--hover)]"
          style={{ color: "var(--ink-mid)" }}
        >
          <Icon name="notifications" size={20} />
          {unreadCount > 0 && (
            <span
              className="absolute top-1 right-1 size-2 rounded-full"
              style={{ background: "var(--coral)", animation: "var(--animate-live)" }}
            />
          )}
        </button>

        <div className="w-px h-5 mx-0.5" style={{ background: "var(--line)" }} />

        {/* User chip */}
        <button
          type="button"
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
      className="p-1.5 rounded-lg transition-colors hover:bg-[var(--hover)]"
      style={{ color: "var(--ink-mid)" }}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Icon name={isDark ? "dark_mode" : "light_mode"} size={20} />
    </button>
  );
}
