import { requireInstructor } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/ui";
import { startOfMonth, subDays, fmtMonthDay } from "@/lib/date";

export default async function AdminPage() {
  await requireInstructor();

  const now        = new Date();
  const monthStart = startOfMonth(now);
  const weekStart  = subDays(now, 7);

  const [
    totalUsers, freeUsers, proUsers, fundedUsers,
    newUsersMonth, totalTrades, tradesMonth,
    totalPosts, postsMonth,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { plan: "FREE"   } }),
    prisma.user.count({ where: { plan: "PRO"    } }),
    prisma.user.count({ where: { plan: "FUNDED" } }),
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
    { label: "Total members",       value: totalUsers.toLocaleString(),   icon: "group",          color: "var(--teal)"  },
    { label: "Pro subscribers",      value: proUsers.toLocaleString(),      icon: "trending_up",    color: "var(--teal)"  },
    { label: "Funded Track",         value: fundedUsers.toLocaleString(),   icon: "workspace_premium", color: "var(--gold)" },
    { label: "New this month",       value: newUsersMonth.toLocaleString(), icon: "person_add",     color: "var(--teal)"  },
    { label: "Trades all time",      value: totalTrades.toLocaleString(),   icon: "menu_book",      color: "var(--ink-mid)" },
    { label: "Trades this month",    value: tradesMonth.toLocaleString(),   icon: "show_chart",     color: "var(--teal)"  },
    { label: "Posts all time",       value: totalPosts.toLocaleString(),    icon: "forum",          color: "var(--ink-mid)" },
    { label: "Posts this month",     value: postsMonth.toLocaleString(),    icon: "chat",           color: "var(--teal)"  },
  ];

  return (
    <div className="view">
      <div className="mb-6">
        <h1 className="font-display font-bold" style={{ fontSize: 24, letterSpacing: "-0.02em", color: "var(--ink-strong)" }}>
          Platform Stats
        </h1>
        <p className="text-[13px] mt-0.5" style={{ color: "var(--ink-dim)" }}>
          Live overview of the Smile FX Traders community.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-4"
            style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-rounded text-[18px]" style={{ color: s.color }}>{s.icon}</span>
              <span className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "var(--ink-dim)" }}>
                {s.label}
              </span>
            </div>
            <div className="font-display font-bold tabular-nums" style={{ fontSize: 28, color: "var(--ink-strong)", letterSpacing: "-0.03em" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Plan breakdown */}
      <div
        className="rounded-2xl p-5 mb-6"
        style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
      >
        <h2 className="font-display font-semibold text-[16px] mb-4" style={{ color: "var(--ink-strong)" }}>
          Plan distribution
        </h2>
        <div className="flex flex-col gap-3">
          {[
            { label: "Starter (Free)", count: freeUsers,   color: "var(--ink-dim)" },
            { label: "Pro Trader",     count: proUsers,    color: "var(--teal)"    },
            { label: "Funded Track",   count: fundedUsers, color: "var(--gold)"    },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-28 text-[12.5px]" style={{ color: "var(--ink-mid)" }}>{label}</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--track)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.round((count / Math.max(totalUsers, 1)) * 100)}%`, background: color }}
                />
              </div>
              <span className="w-10 text-right font-semibold tabular-nums text-[12.5px]" style={{ color }}>
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent signups */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
      >
        <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "var(--line)" }}>
          <Icon name="person_add" size={18} style={{ color: "var(--teal)" }} />
          <span className="font-display font-semibold text-[15px]" style={{ color: "var(--ink-strong)" }}>
            New members (last 7 days)
          </span>
        </div>
        {recentUsers.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px]" style={{ color: "var(--ink-dim)" }}>
            No new signups this week.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--line)" }}>
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div
                  className="size-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                  style={{ background: "linear-gradient(135deg, var(--teal), var(--navy))", color: "#fff" }}
                >
                  {u.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold" style={{ color: "var(--ink-strong)" }}>{u.name}</div>
                  <div className="text-[11.5px]" style={{ color: "var(--ink-dim)" }}>@{u.username}</div>
                </div>
                <span
                  className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={u.plan === "FREE"
                    ? { background: "var(--panel-2)", color: "var(--ink-dim)" }
                    : u.plan === "PRO"
                      ? { background: "rgba(8,174,170,0.12)", color: "var(--teal)" }
                      : { background: "rgba(248,185,61,0.12)", color: "var(--gold)" }
                  }
                >
                  {u.plan === "FREE" ? "Free" : u.plan === "PRO" ? "Pro" : "Funded"}
                </span>
                <span className="text-[11px] shrink-0" style={{ color: "var(--ink-dim)" }}>
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
