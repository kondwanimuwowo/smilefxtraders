import { requireInstructor } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { fmtCompact } from "@/lib/date";
import { InviteUserForm } from "./InviteUserForm";
import { ResponsiveRow } from "@/components/ui";
import { cn } from "@/lib/cn";

const GRID_COLS = "1fr 1fr 80px 60px 60px 80px";

export default async function AdminStudentsPage() {
  await requireInstructor();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id:        true,
      name:      true,
      username:  true,
      email:     true,
      plan:      true,
      role:      true,
      level:     true,
      streak:    true,
      createdAt: true,
      _count:    { select: { trades: true, posts: true } },
    },
  });

  return (
    <div className="view">
      <div className="mb-6">
        <h1 className="font-display font-bold text-[24px] tracking-[-0.02em] text-ink-strong">
          Students
        </h1>
        <p className="text-[13px] mt-0.5 text-ink-dim">
          {users.length} members registered on the platform.
        </p>
      </div>

      <InviteUserForm />

      <div className="rounded-2xl overflow-hidden bg-panel border border-line">
        {/* Table header — desktop only, mobile cards show labels inline */}
        <div className="hidden md:grid px-5 py-2.5 text-[11px] uppercase tracking-wide font-semibold border-b border-line text-ink-dim bg-panel-2" style={{ gridTemplateColumns: GRID_COLS }}>
          <span>Name</span>
          <span>Email</span>
          <span>Plan</span>
          <span className="text-right">Trades</span>
          <span className="text-right">Posts</span>
          <span className="text-right">Joined</span>
        </div>

        {users.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px] text-ink-dim">
            No students yet.
          </div>
        ) : (
          <div className="md:divide-y divide-line px-3 py-3 md:p-0">
            {users.map((u) => (
              <ResponsiveRow
                key={u.id}
                gridTemplateColumns={GRID_COLS}
                className="items-center px-5 py-3"
                cells={[
                  {
                    label: "Name",
                    value: (
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold truncate text-ink-strong">
                          {u.name}
                          {u.role === "INSTRUCTOR" && (
                            <span className="ml-1.5 text-[10px] font-bold uppercase text-gold">instructor</span>
                          )}
                        </div>
                        <div className="text-[11.5px] truncate text-ink-dim">@{u.username}</div>
                      </div>
                    ),
                  },
                  {
                    label: "Email",
                    value: <span className="text-[12.5px] truncate pr-3 text-ink-mid">{u.email}</span>,
                  },
                  {
                    label: "Plan",
                    value: (
                      <span
                        className={cn(
                          "text-[11px] font-semibold px-2.5 py-0.5 rounded-full",
                          u.plan === "FREE" ? "bg-panel-2 text-ink-dim"
                            : u.plan === "PRO" ? "bg-[rgba(8,174,170,0.12)] text-teal"
                              : "bg-[rgba(248,185,61,0.12)] text-gold"
                        )}
                      >
                        {u.plan === "FREE" ? "Free" : u.plan === "PRO" ? "Pro" : "Funded"}
                      </span>
                    ),
                  },
                  {
                    label: "Trades",
                    align: "right",
                    value: <span className="tabular-nums text-[13px] font-semibold text-ink-strong">{u._count.trades}</span>,
                  },
                  {
                    label: "Posts",
                    align: "right",
                    value: <span className="tabular-nums text-[13px] font-semibold text-ink-strong">{u._count.posts}</span>,
                  },
                  {
                    label: "Joined",
                    align: "right",
                    value: <span className="text-[11.5px] text-ink-dim">{fmtCompact(u.createdAt)}</span>,
                  },
                ]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
