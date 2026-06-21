"use client";

import { useStore } from "@/lib/store";
import { Icon } from "@/components/ui";

const TONE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  teal:  { icon: "notifications_active", color: "var(--teal)",    bg: "rgba(8,174,170,0.1)"  },
  gold:  { icon: "workspace_premium",    color: "var(--gold)",    bg: "rgba(248,185,61,0.1)" },
  coral: { icon: "warning",              color: "var(--coral)",   bg: "rgba(234,82,61,0.1)"  },
};

import { fmtRelative } from "@/lib/date";
function timeAgo(iso: string): string { return fmtRelative(iso); }

export function Notifications() {
  const { notifs, markNotifsRead } = useStore();

  const unread = notifs.filter((n) => n.unread);
  const read   = notifs.filter((n) => !n.unread);

  return (
    <div className="view" style={{ maxWidth: 680 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="font-display font-bold"
            style={{ fontSize: 24, letterSpacing: "-0.02em", color: "var(--ink-strong)" }}
          >
            Notifications
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--ink-dim)" }}>
            Alerts, trade updates, and platform messages.
          </p>
        </div>
        {unread.length > 0 && (
          <button
            type="button"
            onClick={markNotifsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-semibold transition-colors hover:bg-[var(--hover)]"
            style={{ color: "var(--teal)", border: "1px solid rgba(8,174,170,0.3)" }}
          >
            <Icon name="done_all" size={15} />
            Mark all read
          </button>
        )}
      </div>

      {notifs.length === 0 ? (
        <div
          className="rounded-2xl flex flex-col items-center py-20 text-center"
          style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
        >
          <div
            className="size-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(8,174,170,0.08)", border: "1px solid rgba(8,174,170,0.15)" }}
          >
            <Icon name="notifications" size={26} style={{ color: "var(--teal)" }} />
          </div>
          <div className="font-semibold text-[15px] mb-1" style={{ color: "var(--ink-strong)" }}>
            All clear
          </div>
          <div className="text-[13px]" style={{ color: "var(--ink-dim)" }}>
            You have no notifications right now.
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {unread.length > 0 && (
            <section>
              <div
                className="text-[11px] font-semibold uppercase tracking-widest mb-2 px-1"
                style={{ color: "var(--ink-dim)" }}
              >
                Unread · {unread.length}
              </div>
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid rgba(8,174,170,0.2)", background: "var(--panel)" }}
              >
                {unread.map((n, i) => {
                  const cfg = TONE_CONFIG[n.tone] ?? TONE_CONFIG.teal;
                  return (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 px-4 py-3.5"
                      style={{
                        borderTop: i > 0 ? "1px solid var(--line)" : undefined,
                        background: "rgba(8,174,170,0.03)",
                      }}
                    >
                      <div
                        className="size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: cfg.bg }}
                      >
                        <span
                          className="material-symbols-rounded"
                          style={{ fontSize: 17, color: cfg.color, fontVariationSettings: "'FILL' 1" }}
                        >
                          {n.icon || cfg.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {n.title && (
                          <div className="text-[13px] font-semibold mb-0.5" style={{ color: "var(--ink-strong)" }}>
                            {n.title}
                          </div>
                        )}
                        <div className="text-[13px] leading-snug" style={{ color: n.title ? "var(--ink-mid)" : "var(--ink-strong)" }}>
                          {n.body}
                        </div>
                        <div className="text-[11.5px] mt-1" style={{ color: "var(--ink-dim)" }}>
                          {timeAgo(n.time)}
                        </div>
                      </div>
                      <div className="size-2 rounded-full mt-2 shrink-0" style={{ background: "var(--teal)" }} />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {read.length > 0 && (
            <section>
              <div
                className="text-[11px] font-semibold uppercase tracking-widest mb-2 px-1"
                style={{ color: "var(--ink-dim)" }}
              >
                Earlier
              </div>
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid var(--line)", background: "var(--panel)" }}
              >
                {read.map((n, i) => {
                  const cfg = TONE_CONFIG[n.tone] ?? TONE_CONFIG.teal;
                  return (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 px-4 py-3.5"
                      style={{ borderTop: i > 0 ? "1px solid var(--line)" : undefined, opacity: 0.65 }}
                    >
                      <div
                        className="size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: cfg.bg }}
                      >
                        <span
                          className="material-symbols-rounded"
                          style={{ fontSize: 17, color: cfg.color, fontVariationSettings: "'FILL' 1" }}
                        >
                          {n.icon || cfg.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {n.title && (
                          <div className="text-[13px] font-semibold mb-0.5" style={{ color: "var(--ink-strong)" }}>
                            {n.title}
                          </div>
                        )}
                        <div className="text-[13px] leading-snug" style={{ color: "var(--ink-mid)" }}>
                          {n.body}
                        </div>
                        <div className="text-[11.5px] mt-1" style={{ color: "var(--ink-dim)" }}>
                          {timeAgo(n.time)}
                        </div>
                      </div>
                    </div>
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
