import { requireInstructor } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { fmtCompact } from "@/lib/date";

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

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
      >
        {/* Table header */}
        <div
          className="grid px-5 py-2.5 text-[11px] uppercase tracking-wide font-semibold"
          style={{
            gridTemplateColumns: "1fr 1fr 80px 60px 60px 80px",
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
          <div className="divide-y" style={{ borderColor: "var(--line)" }}>
            {users.map((u) => (
              <div
                key={u.id}
                className="grid items-center px-5 py-3"
                style={{ gridTemplateColumns: "1fr 1fr 80px 60px 60px 80px" }}
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate" style={{ color: "var(--ink-strong)" }}>
                    {u.name}
                    {u.role === "INSTRUCTOR" && (
                      <span className="ml-1.5 text-[10px] font-bold uppercase" style={{ color: "var(--gold)" }}>instructor</span>
                    )}
                  </div>
                  <div className="text-[11.5px] truncate" style={{ color: "var(--ink-dim)" }}>@{u.username}</div>
                </div>
                <div className="text-[12.5px] truncate pr-3" style={{ color: "var(--ink-mid)" }}>{u.email}</div>
                <div>
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
                </div>
                <div className="text-right tabular-nums text-[13px] font-semibold" style={{ color: "var(--ink-strong)" }}>
                  {u._count.trades}
                </div>
                <div className="text-right tabular-nums text-[13px] font-semibold" style={{ color: "var(--ink-strong)" }}>
                  {u._count.posts}
                </div>
                <div className="text-right text-[11.5px]" style={{ color: "var(--ink-dim)" }}>
                  {fmtCompact(u.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
