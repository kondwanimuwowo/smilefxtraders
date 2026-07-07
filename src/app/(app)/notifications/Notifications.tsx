"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { useMarkNotifsRead } from "@/lib/hooks/useNotifications";
import { Icon } from "@/components/ui";

const TONE_CONFIG: Record<string, { icon: string; iconCls: string; bgCls: string }> = {
  teal:  { icon: "notifications_active", iconCls: "text-teal",  bgCls: "bg-[rgba(8,174,170,0.1)]"  },
  gold:  { icon: "workspace_premium",    iconCls: "text-gold",  bgCls: "bg-[rgba(248,185,61,0.1)]" },
  coral: { icon: "warning",              iconCls: "text-coral", bgCls: "bg-[rgba(234,82,61,0.1)]"  },
};

import { fmtRelative } from "@/lib/date";
function timeAgo(iso: string): string { return fmtRelative(iso); }

export function Notifications() {
  const { notifs } = useStore();
  const markRead = useMarkNotifsRead();

  const unread = notifs.filter((n) => n.unread);
  const read   = notifs.filter((n) => !n.unread);

  return (
    <div className="view max-w-[680px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl tracking-[-0.02em] text-ink-strong">
            Notifications
          </h1>
          <p className="text-[13px] mt-0.5 text-ink-dim">
            Alerts, trade updates, and platform messages.
          </p>
        </div>
        {unread.length > 0 && (
          <button
            type="button"
            onClick={() => markRead.mutate({ all: true })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-semibold transition-colors hover:bg-hover text-teal border border-[rgba(8,174,170,0.3)]"
          >
            <Icon name="done_all" size={15} />
            Mark all read
          </button>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="rounded-2xl flex flex-col items-center py-20 text-center bg-panel border border-line">
          <div className="size-14 rounded-2xl flex items-center justify-center mb-4 bg-[rgba(8,174,170,0.08)] border border-[rgba(8,174,170,0.15)]">
            <Icon name="notifications" size={26} className="text-teal" />
          </div>
          <div className="font-semibold text-[15px] mb-1 text-ink-strong">
            All clear
          </div>
          <div className="text-[13px] text-ink-dim">
            You have no notifications right now.
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {unread.length > 0 && (
            <section>
              <div className="text-[11px] font-semibold uppercase tracking-widest mb-2 px-1 text-ink-dim">
                Unread · {unread.length}
              </div>
              <div className="rounded-2xl overflow-hidden border border-[rgba(8,174,170,0.2)] bg-panel">
                {unread.map((n, i) => {
                  const cfg = TONE_CONFIG[n.tone] ?? TONE_CONFIG.teal;
                  return (
                    <Link
                      key={n.id}
                      href={n.href ?? "#"}
                      onClick={() => markRead.mutate({ id: n.id })}
                      className={`flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-hover bg-[rgba(8,174,170,0.03)] ${i > 0 ? "border-t border-line" : ""}`}
                    >
                      <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${cfg.bgCls}`}>
                        <span className={`material-symbols-rounded ic-fill text-[17px] ${cfg.iconCls}`}>
                          {n.icon || cfg.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {n.title && (
                          <div className="text-[13px] font-semibold mb-0.5 text-ink-strong">
                            {n.title}
                          </div>
                        )}
                        <div className={`text-[13px] leading-snug ${n.title ? "text-ink-mid" : "text-ink-strong"}`}>
                          {n.body}
                        </div>
                        <div className="text-[11.5px] mt-1 text-ink-dim">
                          {timeAgo(n.time)}
                        </div>
                      </div>
                      <div className="size-2 rounded-full mt-2 shrink-0 bg-teal" />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {read.length > 0 && (
            <section>
              <div className="text-[11px] font-semibold uppercase tracking-widest mb-2 px-1 text-ink-dim">
                Earlier
              </div>
              <div className="rounded-2xl overflow-hidden border border-line bg-panel">
                {read.map((n, i) => {
                  const cfg = TONE_CONFIG[n.tone] ?? TONE_CONFIG.teal;
                  return (
                    <Link
                      key={n.id}
                      href={n.href ?? "#"}
                      className={`flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-hover opacity-65 ${i > 0 ? "border-t border-line" : ""}`}
                    >
                      <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${cfg.bgCls}`}>
                        <span className={`material-symbols-rounded ic-fill text-[17px] ${cfg.iconCls}`}>
                          {n.icon || cfg.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {n.title && (
                          <div className="text-[13px] font-semibold mb-0.5 text-ink-strong">
                            {n.title}
                          </div>
                        )}
                        <div className="text-[13px] leading-snug text-ink-mid">
                          {n.body}
                        </div>
                        <div className="text-[11.5px] mt-1 text-ink-dim">
                          {timeAgo(n.time)}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
