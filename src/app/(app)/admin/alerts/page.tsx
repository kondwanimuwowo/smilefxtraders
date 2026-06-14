import { requireInstructor } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Icon } from "@/components/ui";

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  ACTIVE:    { bg: "rgba(8,174,170,0.12)",   color: "var(--teal)",        label: "Active"    },
  TP1:       { bg: "rgba(8,174,170,0.08)",   color: "var(--teal-bright)", label: "TP1 Hit"   },
  TP2:       { bg: "rgba(8,174,170,0.12)",   color: "var(--teal-bright)", label: "TP2 Hit"   },
  SL:        { bg: "rgba(234,82,61,0.1)",    color: "var(--coral)",       label: "SL Hit"    },
  CANCELLED: { bg: "rgba(154,154,154,0.08)", color: "var(--ink-dim)",     label: "Cancelled" },
  CLOSED:    { bg: "rgba(154,154,154,0.08)", color: "var(--ink-dim)",     label: "Closed"    },
};

export default async function AdminAlertsPage() {
  await requireInstructor();

  const [alerts, copyCounts] = await Promise.all([
    prisma.alert.findMany({
      orderBy: { postedAt: "desc" },
      take:    100,
      select: {
        id:        true,
        pair:      true,
        direction: true,
        model:     true,
        status:    true,
        entryPrice: true,
        tp1:        true,
        rr:         true,
        postedAt:  true,
      },
    }),
    // Count trades copied from each alert
    prisma.trade.groupBy({
      by:     ["fromAlert"],
      where:  { fromAlert: { not: null } },
      _count: { id: true },
    }),
  ]);

  const copyMap = new Map(copyCounts.map((c) => [c.fromAlert, c._count.id]));

  const totalAlerts  = alerts.length;
  const activeAlerts = alerts.filter((a) => a.status === "ACTIVE").length;
  const tp1Hits      = alerts.filter((a) => a.status === "TP1" || a.status === "TP2").length;
  const slHits       = alerts.filter((a) => a.status === "SL").length;
  const hitRate      = totalAlerts > 0 ? Math.round((tp1Hits / totalAlerts) * 100) : 0;
  const totalCopies  = [...copyMap.values()].reduce((s, v) => s + v, 0);

  return (
    <div className="view">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-bold" style={{ fontSize: 24, letterSpacing: "-0.02em", color: "var(--ink-strong)" }}>
            Alerts Manager
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--ink-dim)" }}>
            Post and manage setup alerts. Students receive notifications in real-time.
          </p>
        </div>
        <Link
          href="/alerts"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all active:scale-95"
          style={{ background: "var(--teal)", color: "#fff" }}
        >
          <Icon name="add" size={18} />
          Post Alert
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total",        value: totalAlerts,  color: "var(--ink-strong)"  },
          { label: "Active",       value: activeAlerts, color: "var(--teal)"        },
          { label: "TP Hit",       value: tp1Hits,      color: "var(--teal-bright)" },
          { label: "SL Hit",       value: slHits,       color: "var(--coral)"       },
          { label: "Trade copies", value: totalCopies,  color: "var(--gold)"        },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: "var(--panel)", border: "1px solid var(--line)" }}>
            <div className="text-[11px] uppercase tracking-wide font-semibold mb-1" style={{ color: "var(--ink-dim)" }}>{label}</div>
            <div className="font-display font-bold tabular-nums text-[24px]" style={{ color, letterSpacing: "-0.03em" }}>{value}</div>
            {label === "TP Hit" && totalAlerts > 0 && (
              <div className="text-[11px] mt-0.5" style={{ color: "var(--ink-dim)" }}>{hitRate}% hit rate</div>
            )}
          </div>
        ))}
      </div>

      {/* Alerts table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--panel)", border: "1px solid var(--line)" }}>
        <div
          className="grid px-5 py-2.5 text-[11px] uppercase tracking-wide font-semibold"
          style={{
            gridTemplateColumns: "90px 50px 1fr 90px 80px 80px 60px 70px 80px",
            borderBottom: "1px solid var(--line)",
            color: "var(--ink-dim)",
            background: "var(--panel-2)",
          }}
        >
          <span>Pair</span>
          <span>Dir</span>
          <span>Model</span>
          <span>Status</span>
          <span className="text-right">Entry</span>
          <span className="text-right">TP1</span>
          <span className="text-right">R:R</span>
          <span className="text-right">Copies</span>
          <span className="text-right">Posted</span>
        </div>

        {alerts.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px]" style={{ color: "var(--ink-dim)" }}>
            No alerts posted yet.{" "}
            <Link href="/alerts" style={{ color: "var(--teal)" }}>Go to Alerts</Link> to post your first setup.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--line)" }}>
            {alerts.map((a) => {
              const s     = STATUS_STYLE[a.status] ?? STATUS_STYLE.CLOSED;
              const copies = copyMap.get(a.id) ?? 0;
              return (
                <div
                  key={a.id}
                  className="grid items-center px-5 py-3"
                  style={{ gridTemplateColumns: "90px 50px 1fr 90px 80px 80px 60px 70px 80px" }}
                >
                  <span className="font-semibold text-[13px]" style={{ color: "var(--ink-strong)" }}>{a.pair}</span>
                  <span
                    className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full w-fit"
                    style={a.direction === "LONG"
                      ? { background: "rgba(8,174,170,0.12)", color: "var(--teal)" }
                      : { background: "rgba(234,82,61,0.1)",  color: "var(--coral)" }
                    }
                  >
                    {a.direction === "LONG" ? "L" : "S"}
                  </span>
                  <span className="text-[12.5px] truncate pr-2" style={{ color: "var(--ink-mid)" }}>{a.model}</span>
                  <span
                    className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full w-fit"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {s.label}
                  </span>
                  <span className="text-right tabular-nums text-[12.5px]" style={{ color: "var(--ink-mid)" }}>
                    {a.entryPrice.toFixed(4)}
                  </span>
                  <span className="text-right tabular-nums text-[12.5px]" style={{ color: "var(--ink-mid)" }}>
                    {a.tp1?.toFixed(4) ?? "—"}
                  </span>
                  <span className="text-right tabular-nums text-[12.5px]" style={{ color: "var(--gold)" }}>
                    {a.rr ? `${a.rr}R` : "—"}
                  </span>
                  <span className="text-right tabular-nums font-semibold text-[12.5px]" style={{ color: copies > 0 ? "var(--teal)" : "var(--ink-dim)" }}>
                    {copies}
                  </span>
                  <span className="text-right text-[11.5px]" style={{ color: "var(--ink-dim)" }}>
                    {a.postedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
