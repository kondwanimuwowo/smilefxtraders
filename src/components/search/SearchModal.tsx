"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useTrades } from "@/lib/hooks/useTrades";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui";
import type { Trade, FeedPost } from "@/lib/store";

type Result = { type: "trade" | "alert" | "post"; label: string; sub: string; href: string };

function search(q: string, trades: Trade[], feed: FeedPost[]): Result[] {
  if (!q.trim()) return [];
  const ql = q.toLowerCase();
  const results: Result[] = [];

  trades.slice().reverse().forEach((t) => {
    const haystack = `${t.pair} ${t.model} ${t.session} ${t.note ?? ""}`.toLowerCase();
    if (haystack.includes(ql)) {
      results.push({
        type: "trade",
        label: `${t.pair} · ${t.dir === "long" ? "Long" : "Short"} · ${t.model}`,
        sub: `${t.date} · ${t.result === "win" ? "+R" : t.result === "loss" ? "-1R" : "Open"} · ${t.session}`,
        href: `/journal/${t.id}`,
      });
    }
  });

  feed.forEach((p) => {
    const haystack = `${p.text} ${p.pair ?? ""} ${p.handle ?? ""}`.toLowerCase();
    if (haystack.includes(ql)) {
      results.push({
        type: "post",
        label: p.text.slice(0, 72) + (p.text.length > 72 ? "…" : ""),
        sub: `@${p.handle ?? "trader"} · community`,
        href: `/community`,
      });
    }
  });

  return results.slice(0, 10);
}

const TYPE_ICON: Record<string, string> = { trade: "menu_book", alert: "notifications_active", post: "forum" };
const TYPE_LABEL: Record<string, string> = { trade: "Trade", alert: "Alert", post: "Post" };

export function SearchModal({ onClose }: { onClose: () => void }) {
  const [q, setQ]           = useState("");
  const [sel, setSel]       = useState(0);
  const inputRef            = useRef<HTMLInputElement>(null);
  const router              = useRouter();
  const { feed }            = useStore();
  const { trades }          = useTrades();

  const results = search(q, trades, feed);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
      if (e.key === "Enter" && results[sel]) { router.push(results[sel].href); onClose(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, results, sel, router]);

  useEffect(() => { setSel(0); }, [q]);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] bg-[rgba(8,42,59,0.55)] backdrop-blur-[6px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full rounded-2xl overflow-hidden shadow-2xl max-w-[560px] bg-panel border border-line">
        {/* Input */}
        <div className="flex items-center gap-2.5 px-[18px] py-3.5 border-b border-line">
          <Icon name="search" size={20} className="text-ink-dim" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search trades, posts…"
            className="flex-1 border-none outline-none bg-transparent text-base text-ink font-sans"
          />
          <kbd className="text-[11px] px-1.5 py-0.5 rounded-[5px] shrink-0 bg-track text-ink-dim">Esc</kbd>
        </div>

        {/* Results */}
        {q.trim() && (
          <div className="max-h-[360px] overflow-y-auto">
            {results.length === 0 ? (
              <div className="px-[18px] py-7 text-center text-sm text-ink-dim">
                No results for &quot;{q}&quot;
              </div>
            ) : results.map((r, i) => (
              <button
                key={r.href + i}
                type="button"
                onClick={() => { router.push(r.href); onClose(); }}
                onMouseEnter={() => setSel(i)}
                className={cn(
                  "w-full text-left flex items-center gap-3 px-[18px] py-3",
                  i === sel ? "bg-[var(--bg-hover)]" : "bg-transparent",
                  i < results.length - 1 && "border-b border-line"
                )}
              >
                <Icon name={TYPE_ICON[r.type]} size={18} className="text-teal shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink whitespace-nowrap overflow-hidden text-ellipsis">{r.label}</div>
                  <div className="text-xs mt-0.5 text-ink-dim">{r.sub}</div>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-md shrink-0 bg-[var(--bg-soft)] text-ink-dim">{TYPE_LABEL[r.type]}</span>
              </button>
            ))}
          </div>
        )}

        {!q.trim() && (
          <div className="px-[18px] py-[18px] flex gap-5 flex-wrap">
            {[
              { label: "Journal",   href: "/journal",   icon: "menu_book" },
              { label: "Validator", href: "/validator", icon: "rule" },
              { label: "Alerts",    href: "/alerts",    icon: "notifications_active" },
              { label: "Community", href: "/community", icon: "forum" },
            ].map((s) => (
              <button
                key={s.href}
                type="button"
                onClick={() => { router.push(s.href); onClose(); }}
                className="flex items-center gap-1.5 text-[13.5px] font-medium px-3.5 py-2 rounded-[10px] border-none cursor-pointer bg-[var(--bg-soft)] text-ink-mid"
              >
                <Icon name={s.icon} size={17} className="text-teal" />
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
