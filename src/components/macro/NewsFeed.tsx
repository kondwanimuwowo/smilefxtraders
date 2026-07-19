"use client";

import { useEffect, useState } from "react";
import { Icon, Panel, PanelHead, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { MacroNewsItem } from "@/types/macro";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Currency-tagged news is a keyword-match heuristic (see indicatorMap.ts's
// tagNewsCurrency) — items with no confident match render untagged rather
// than being force-fit into a currency, per the plan's "imperfect by design"
// note.
export function NewsFeed({ currency }: { currency?: string }) {
  const [items, setItems] = useState<MacroNewsItem[] | null>(null);

  useEffect(() => {
    const qs = currency ? `?currency=${currency}` : "";
    fetch(`/api/macro/news${qs}`)
      .then((r) => r.json() as Promise<MacroNewsItem[]>)
      .then(setItems)
      .catch(() => setItems([]));
  }, [currency]);

  const loading = items === null;

  return (
    <Panel>
      <PanelHead title={currency ? `${currency} News` : "Recent News"} icon="newspaper" />
      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} h={40} r={8} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl px-4 py-4 flex items-start gap-3 text-[12.5px] bg-panel-2 shadow-sm text-ink-dim">
          <Icon name="rss_feed" size={16} className="text-ink-dim shrink-0 mt-px" />
          <span>No recent news{currency ? ` tagged ${currency}` : ""} yet — the news sync job populates this.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {items.map((item, i) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-start gap-2.5 py-2.5 px-2 -mx-2 rounded-lg hover:opacity-75 transition-opacity",
                i < items.length - 1 && "border-b border-line"
              )}
            >
              <Icon name="open_in_new" size={13} className="text-ink-dim shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-medium text-ink-strong leading-snug">{item.headline}</div>
                <div className="text-[11px] text-ink-dim mt-0.5">
                  {item.source} · {timeAgo(item.publishedAt)}
                  {item.currency && !currency && ` · ${item.currency}`}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </Panel>
  );
}
