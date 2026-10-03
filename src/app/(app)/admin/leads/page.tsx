import { requireInstructor } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { Panel, PanelHead } from "@/components/ui";
import { LeadsExport } from "./LeadsExport";

export default async function LeadsPage() {
  await requireInstructor();

  const [signups, sourceCounts] = await Promise.all([
    prisma.waitlistSignup.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.waitlistSignup.groupBy({ by: ["source"], _count: { _all: true } }),
  ]);

  const countBy = (source: string) =>
    sourceCounts.find((c) => c.source === source)?._count._all ?? 0;

  const rows = signups.map((s) => ({
    id: s.id,
    email: s.email,
    source: s.source,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-medium text-2xl tracking-[-0.02em] text-ink-strong">Leads</h1>
          <p className="text-[13px] mt-0.5 text-ink-dim">Emails collected from the waitlist and maintenance pages.</p>
        </div>
        <LeadsExport rows={rows} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile label="Total" value={signups.length} />
        <StatTile label="Waitlist page" value={countBy("waitlist")} />
        <StatTile label="Maintenance page" value={countBy("maintenance")} />
      </div>

      <Panel pad={0} className="overflow-hidden">
        <PanelHead title="Signups" sub={`${signups.length} total, newest first`} />
        {rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13.5px] text-ink-dim">No signups yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-ink-dim">
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Source</th>
                  <th className="px-5 py-3 font-semibold">Signed up</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-line-soft">
                    <td className="px-5 py-3 text-ink-strong">{r.email}</td>
                    <td className="px-5 py-3 text-ink-mid">{r.source}</td>
                    <td className="px-5 py-3 text-ink-mid tabular-nums">{r.createdAt.slice(0, 16).replace("T", " ")} UTC</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-panel p-4 shadow-sm">
      <div className="text-[12px] text-ink-dim">{label}</div>
      <div className="font-display font-bold text-[22px] text-ink-strong tabular-nums mt-1">{value}</div>
    </div>
  );
}
