import { requireInstructor } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { fmtCompact } from "@/lib/date";
import { InviteUserForm } from "./InviteUserForm";
import { ResponsiveRow } from "@/components/ui";

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
        <h1 className="font-display font-bold" style={{ fontSize: 24, letterSpacing: "-0.02em", color: "var(--ink-strong)" }}>
          Students
        </h1>
        <p className="text-[13px] mt-0.5" style={{ color: "var(--ink-dim)" }}>
          {users.length} members registered on the platform.
        </p>
      </div>

      <InviteUserForm />

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
      >
        {/* Table header — desktop only, mobile cards show labels inline */}
        <div
          className="hidden md:grid px-5 py-2.5 text-[11px] uppercase tracking-wide font-semibold"
          style={{
            gridTemplateColumns: GRID_COLS,
            borderBottom: "1px solid var(--line)",
            color: "var(--ink-dim)",
            background: "var(--panel-2)",
          }}
        >
          <span>Name</span>
          <span>Email</span>
          <span>Plan</span>
          <span className="text-right">Trades</span>
          <span className="text-right">Posts</span>
          <span className="text-right">Joined</span>
        </div>

        {users.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px]" style={{ color: "var(--ink-dim)" }}>
            No students yet.
          </div>
        ) : (
          <div className="md:divide-y px-3 py-3 md:p-0" style={{ borderColor: "var(--line)" }}>
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
                        <div className="text-[13px] font-semibold truncate" style={{ color: "var(--ink-strong)" }}>
                          {u.name}
                          {u.role === "INSTRUCTOR" && (
                            <span className="ml-1.5 text-[10px] font-bold uppercase" style={{ color: "var(--gold)" }}>instructor</span>
                          )}
                        </div>
                        <div className="text-[11.5px] truncate" style={{ color: "var(--ink-dim)" }}>@{u.username}</div>
                      </div>
                    ),
                  },
                  {
                    label: "Email",
                    value: <span className="text-[12.5px] truncate pr-3" style={{ color: "var(--ink-mid)" }}>{u.email}</span>,
                  },
                  {
                    label: "Plan",
                    value: (
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
                    ),
                  },
                  {
                    label: "Trades",
                    align: "right",
                    value: <span className="tabular-nums text-[13px] font-semibold" style={{ color: "var(--ink-strong)" }}>{u._count.trades}</span>,
                  },
                  {
                    label: "Posts",
                    align: "right",
                    value: <span className="tabular-nums text-[13px] font-semibold" style={{ color: "var(--ink-strong)" }}>{u._count.posts}</span>,
                  },
                  {
                    label: "Joined",
                    align: "right",
                    value: <span className="text-[11.5px]" style={{ color: "var(--ink-dim)" }}>{fmtCompact(u.createdAt)}</span>,
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
