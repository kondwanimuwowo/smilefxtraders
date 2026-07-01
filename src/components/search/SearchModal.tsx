"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useTrades } from "@/lib/hooks/useTrades";
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
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]"
      style={{ background: "rgba(8,42,59,0.55)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full rounded-2xl overflow-hidden shadow-2xl"
        style={{ maxWidth: 560, background: "var(--panel)", border: "1px solid var(--line)" }}
      >
        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
          <span className="material-symbols-rounded" style={{ fontSize: 20, color: "var(--ink-dim)" }}>search</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search trades, posts…"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 16, color: "var(--ink)", fontFamily: "var(--font-sans)" }}
          />
          <kbd style={{ fontSize: 11, padding: "2px 6px", borderRadius: 5, background: "var(--track)", color: "var(--ink-dim)", flexShrink: 0 }}>Esc</kbd>
        </div>

        {/* Results */}
        {q.trim() && (
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {results.length === 0 ? (
              <div style={{ padding: "28px 18px", textAlign: "center", fontSize: 14, color: "var(--ink-dim)" }}>
                No results for &quot;{q}&quot;
              </div>
            ) : results.map((r, i) => (
              <button
                key={r.href + i}
                type="button"
                onClick={() => { router.push(r.href); onClose(); }}
                onMouseEnter={() => setSel(i)}
                className="w-full text-left"
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", background: i === sel ? "var(--bg-hover)" : "transparent", borderBottom: i < results.length - 1 ? "1px solid var(--line-faint, var(--line))" : "none" }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: "var(--teal)", flexShrink: 0 }}>{TYPE_ICON[r.type]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-dim)", marginTop: 2 }}>{r.sub}</div>
                </div>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "var(--bg-soft)", color: "var(--ink-dim)", flexShrink: 0 }}>{TYPE_LABEL[r.type]}</span>
              </button>
            ))}
          </div>
        )}

        {!q.trim() && (
          <div style={{ padding: "18px 18px", display: "flex", gap: 20, flexWrap: "wrap" }}>
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
                style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 500, color: "var(--ink-mid)", padding: "8px 13px", borderRadius: 10, background: "var(--bg-soft)", border: "none", cursor: "pointer" }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 17, color: "var(--teal)" }}>{s.icon}</span>
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
