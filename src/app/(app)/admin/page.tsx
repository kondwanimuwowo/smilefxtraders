import { requireInstructor } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { startOfMonth, subDays, fmtMonthDay } from "@/lib/date";

export default async function AdminPage() {
  await requireInstructor();

  const now        = new Date();
  const monthStart = startOfMonth(now);
  const weekStart  = subDays(now, 7);

  const [
    totalUsers, freeUsers, edgeUsers, proUsers,
    newUsersMonth, totalTrades, tradesMonth,
    totalPosts, postsMonth,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { plan: "FREE" } }),
    prisma.user.count({ where: { plan: "EDGE" } }),
    prisma.user.count({ where: { plan: "PRO"  } }),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.trade.count(),
    prisma.trade.count({ where: { date: { gte: monthStart } } }),
    prisma.post.count(),
    prisma.post.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.user.findMany({
      where:   { createdAt: { gte: weekStart } },
      orderBy: { createdAt: "desc" },
      take:    10,
      select:  { id: true, name: true, username: true, plan: true, createdAt: true },
    }),
  ]);

  const stats = [
    { label: "Total members",       value: totalUsers.toLocaleString(),   icon: "group",          colorCls: "text-teal"  },
    { label: "Edge subscribers",     value: edgeUsers.toLocaleString(),     icon: "trending_up",    colorCls: "text-teal"  },
    { label: "Pro subscribers",      value: proUsers.toLocaleString(),      icon: "workspace_premium", colorCls: "text-gold" },
    { label: "New this month",       value: newUsersMonth.toLocaleString(), icon: "person_add",     colorCls: "text-teal"  },
    { label: "Trades all time",      value: totalTrades.toLocaleString(),   icon: "menu_book",      colorCls: "text-ink-mid" },
    { label: "Trades this month",    value: tradesMonth.toLocaleString(),   icon: "show_chart",     colorCls: "text-teal"  },
    { label: "Posts all time",       value: totalPosts.toLocaleString(),    icon: "forum",          colorCls: "text-ink-mid" },
    { label: "Posts this month",     value: postsMonth.toLocaleString(),    icon: "chat",           colorCls: "text-teal"  },
  ];

  return (
    <div className="view">
      <div className="mb-6">
        <h1 className="font-display font-bold text-[24px] tracking-[-0.02em] text-ink-strong">
          Platform Stats
        </h1>
        <p className="text-[13px] mt-0.5 text-ink-dim">
          Live overview of the Smile FX Traders community.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl p-4 bg-panel border border-line">
            <div className="flex items-center gap-2 mb-2">
              <Icon name={s.icon} size={18} className={s.colorCls} />
              <span className="text-[11px] uppercase tracking-wide font-semibold text-ink-dim">
                {s.label}
              </span>
            </div>
            <div className="font-display font-bold tabular-nums text-[28px] tracking-[-0.03em] text-ink-strong">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Plan breakdown */}
      <div className="rounded-2xl p-5 mb-6 bg-panel border border-line">
        <h2 className="font-display font-semibold text-[16px] mb-4 text-ink-strong">
          Plan distribution
        </h2>
        <div className="flex flex-col gap-3">
          {[
            { label: "Starter (Free)", count: freeUsers, barCls: "bg-ink-dim", textCls: "text-ink-dim" },
            { label: "Edge",           count: edgeUsers, barCls: "bg-teal",    textCls: "text-teal"    },
            { label: "Pro",            count: proUsers,  barCls: "bg-gold",    textCls: "text-gold"    },
          ].map(({ label, count, barCls, textCls }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-28 text-[12.5px] text-ink-mid">{label}</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden bg-track">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", barCls)}
                  style={{ width: `${Math.round((count / Math.max(totalUsers, 1)) * 100)}%` }}
                />
              </div>
              <span className={cn("w-10 text-right font-semibold tabular-nums text-[12.5px]", textCls)}>
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent signups */}
      <div className="rounded-2xl overflow-hidden bg-panel border border-line">
        <div className="px-5 py-4 border-b border-line flex items-center gap-2">
          <Icon name="person_add" size={18} className="text-teal" />
          <span className="font-display font-semibold text-[15px] text-ink-strong">
            New members (last 7 days)
          </span>
        </div>
        {recentUsers.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px] text-ink-dim">
            No new signups this week.
          </div>
        ) : (
          <div className="divide-y divide-line">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="size-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 bg-[linear-gradient(135deg,var(--teal),var(--navy))] text-white">
                  {u.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-ink-strong">{u.name}</div>
                  <div className="text-[11.5px] text-ink-dim">@{u.username}</div>
                </div>
                <span
                  className={cn(
                    "text-[11px] font-semibold px-2.5 py-0.5 rounded-full",
                    u.plan === "FREE" ? "bg-panel-2 text-ink-dim"
                      : u.plan === "EDGE" ? "bg-[rgba(8,174,170,0.12)] text-teal"
                        : "bg-[rgba(248,185,61,0.12)] text-gold"
                  )}
                >
                  {u.plan === "FREE" ? "Free" : u.plan === "EDGE" ? "Edge" : "Pro"}
                </span>
                <span className="text-[11px] shrink-0 text-ink-dim">
                  {fmtMonthDay(u.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
