import { requireInstructor } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/ui";

// Course list mirrors the Academy.tsx constant — in future, source from DB
const COURSE_IDS = ["c01", "c02", "c03", "c04", "c05", "c06"];
const LESSON_IDS = [
  "l01","l02","l03","l04","l05","l06", // c01
  "l07","l08","l09","l10","l11","l12", // c02
  "l13","l14","l15","l16","l17",       // c03
  "l18","l19","l20",                   // c04
  "l21","l22","l23",                   // c05
  "l24","l25","l26","l27",             // c06
];

const COURSE_META: Record<string, { title: string; tier: string; color: string; lessonIds: string[] }> = {
  c01: { title: "Foundations of Smart Money",      tier: "Free",         color: "var(--teal)",  lessonIds: ["l01","l02","l03","l04","l05","l06"] },
  c02: { title: "Advanced SMC Models",             tier: "Pro",          color: "var(--gold)",  lessonIds: ["l07","l08","l09","l10","l11","l12"] },
  c03: { title: "Risk Management & Psychology",    tier: "Pro",          color: "var(--coral)", lessonIds: ["l13","l14","l15","l16","l17"] },
  c04: { title: "Reading the COT Report",          tier: "Pro",          color: "var(--navy)",  lessonIds: ["l18","l19","l20"] },
  c05: { title: "Live Trade Reviews with Kondwani", tier: "Pro",         color: "var(--teal)",  lessonIds: ["l21","l22","l23"] },
  c06: { title: "Prop Firm Preparation",           tier: "Funded Track", color: "var(--gold)",  lessonIds: ["l24","l25","l26","l27"] },
};

export default async function AdminAcademyPage() {
  await requireInstructor();

  // Count completions per lesson
  const completions = await prisma.lessonProgress.groupBy({
    by:     ["lessonId"],
    where:  { completed: true },
    _count: { lessonId: true },
  });

  const completionMap = new Map(completions.map((c) => [c.lessonId, c._count.lessonId]));

  const totalProgressRecords = await prisma.lessonProgress.count({ where: { completed: true } });
  const totalStudents        = await prisma.user.count({ where: { role: "STUDENT" } });

  return (
    <div className="view">
      <div className="mb-6">
        <h1 className="font-display font-bold" style={{ fontSize: 24, letterSpacing: "-0.02em", color: "var(--ink-strong)" }}>
          Academy Manager
        </h1>
        <p className="text-[13px] mt-0.5" style={{ color: "var(--ink-dim)" }}>
          Track lesson completion rates across all courses.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total students",     value: totalStudents,                          color: "var(--teal)"  },
          { label: "Lessons completed",  value: totalProgressRecords.toLocaleString(),  color: "var(--teal)"  },
          { label: "Total lessons",      value: LESSON_IDS.length,                      color: "var(--ink-mid)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: "var(--panel)", border: "1px solid var(--line)" }}>
            <div className="text-[11px] uppercase tracking-wide font-semibold mb-1" style={{ color: "var(--ink-dim)" }}>{label}</div>
            <div className="font-display font-bold tabular-nums text-[24px]" style={{ color, letterSpacing: "-0.03em" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Per-course breakdown */}
      <div className="flex flex-col gap-4">
        {COURSE_IDS.map((courseId) => {
          const meta    = COURSE_META[courseId];
          if (!meta) return null;
          const lessonRows = meta.lessonIds.map((lid) => ({
            id:          lid,
            completions: completionMap.get(lid) ?? 0,
          }));
          const totalCompletions = lessonRows.reduce((s, l) => s + l.completions, 0);

          return (
            <div
              key={courseId}
              className="rounded-2xl overflow-hidden"
              style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
            >
              <div className="h-1" style={{ background: meta.color }} />
              <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: "var(--line)" }}>
                <div>
                  <span className="font-display font-semibold text-[15px]" style={{ color: "var(--ink-strong)" }}>{meta.title}</span>
                  <span
                    className="ml-2.5 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={meta.tier === "Free"
                      ? { background: "var(--panel-2)", color: "var(--ink-dim)" }
                      : meta.tier === "Pro"
                        ? { background: "rgba(8,174,170,0.12)", color: "var(--teal)" }
                        : { background: "rgba(248,185,61,0.12)", color: "var(--gold)" }
                    }
                  >
                    {meta.tier}
                  </span>
                </div>
                <div className="text-right">
                  <div className="tabular-nums font-semibold text-[14px]" style={{ color: "var(--ink-strong)" }}>
                    {totalCompletions} completions
                  </div>
                  <div className="text-[11.5px]" style={{ color: "var(--ink-dim)" }}>
                    {meta.lessonIds.length} lessons
                  </div>
                </div>
              </div>

              <div className="divide-y" style={{ borderColor: "var(--line)" }}>
                {lessonRows.map((lesson, i) => {
                  const maxInCourse = Math.max(...lessonRows.map((l) => l.completions), 1);
                  const pct = Math.round((lesson.completions / maxInCourse) * 100);
                  return (
                    <div key={lesson.id} className="flex items-center gap-4 px-5 py-2.5">
                      <div
                        className="size-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                        style={{ background: "var(--panel-2)", color: "var(--ink-dim)" }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--track)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: meta.color }}
                        />
                      </div>
                      <span className="w-12 text-right tabular-nums text-[12.5px] font-semibold" style={{ color: "var(--ink-mid)" }}>
                        {lesson.completions}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
