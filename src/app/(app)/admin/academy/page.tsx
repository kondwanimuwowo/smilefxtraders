import Link from "next/link";
import { requireInstructor } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";

export default async function AdminAcademyPage() {
  await requireInstructor();

  const courses = await prisma.course.findMany({
    orderBy: { order: "asc" },
    include: { lessons: { orderBy: { order: "asc" }, select: { id: true, title: true, published: true } } },
  });

  const allLessonIds = courses.flatMap((c) => c.lessons.map((l) => l.id));

  const completions = await prisma.lessonProgress.groupBy({
    by:     ["lessonId"],
    where:  { completed: true, lessonId: { in: allLessonIds } },
    _count: { lessonId: true },
  });
  const completionMap = new Map(completions.map((c) => [c.lessonId, c._count.lessonId]));

  const totalProgressRecords = await prisma.lessonProgress.count({ where: { completed: true } });
  const totalStudents        = await prisma.user.count({ where: { role: "STUDENT" } });
  const totalLessons         = allLessonIds.length;

  return (
    <div className="view">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-[24px] tracking-[-0.02em] text-ink-strong">
            Course Builder
          </h1>
          <p className="text-[13px] mt-0.5 text-ink-dim">
            Manage courses, lessons, and track student completion.
          </p>
        </div>
        <Link
          href="/admin/academy/courses/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all bg-teal text-white"
        >
          <span className="material-symbols-rounded text-[16px]">add</span>
          New course
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total students",    value: totalStudents,                 colorCls: "text-teal"    },
          { label: "Lessons completed", value: totalProgressRecords,          colorCls: "text-teal"    },
          { label: "Total lessons",     value: totalLessons,                  colorCls: "text-ink-mid" },
        ].map(({ label, value, colorCls }) => (
          <div key={label} className="rounded-2xl p-4 bg-panel border border-line">
            <div className="text-[11px] uppercase tracking-wide font-semibold mb-1 text-ink-dim">{label}</div>
            <div className={cn("font-display font-bold tabular-nums text-[24px] tracking-[-0.03em]", colorCls)}>{value}</div>
          </div>
        ))}
      </div>

      {/* Course cards */}
      <div className="flex flex-col gap-4">
        {courses.map((course) => {
          const tierCls   = course.tier === "free" ? "bg-panel-2 text-ink-dim" : course.tier === "pro" ? "bg-[rgba(8,174,170,0.12)] text-teal" : "bg-[rgba(248,185,61,0.12)] text-gold";
          const tierLabel = course.tier === "free" ? "Free" : course.tier === "pro" ? "Pro" : "Funded Track";
          const totalCompletions = course.lessons.reduce((s, l) => s + (completionMap.get(l.id) ?? 0), 0);
          const maxCompletions   = Math.max(...course.lessons.map((l) => completionMap.get(l.id) ?? 0), 1);

          return (
            <div key={course.id} className="rounded-2xl overflow-hidden bg-panel border border-line">
              {/* course.color is per-course DB-stored data (a raw var(--x) string
                  chosen from CourseEditorClient's COLOR_OPTIONS) consumed via
                  runtime string concatenation (`${course.color}20` alpha suffix)
                  - stays inline, can't be a static class. */}
              <div className="h-1" style={{ background: course.color }} />
              <div className="px-5 py-4 flex items-center justify-between border-b border-line">
                <div className="flex items-center gap-3">
                  <div
                    className="size-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${course.color}20` }}
                  >
                    <span className="material-symbols-rounded text-[18px]" style={{ color: course.color }}>{course.icon}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold text-[15px] text-ink-strong">{course.title}</span>
                      <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", tierCls)}>
                        {tierLabel}
                      </span>
                      {!course.published && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(234,82,61,0.12)] text-coral">
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] mt-0.5 text-ink-dim">
                      {course.lessons.length} lessons · {totalCompletions} completions
                    </div>
                  </div>
                </div>
                <Link
                  href={`/admin/academy/courses/${course.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all hover:opacity-80 bg-panel-2 text-ink-mid border border-line"
                >
                  <span className="material-symbols-rounded text-[15px]">edit</span>
                  Edit
                </Link>
              </div>

              {/* Lesson completion bars */}
              <div className="px-5 py-3 divide-y divide-line">
                {course.lessons.map((lesson, i) => {
                  const count = completionMap.get(lesson.id) ?? 0;
                  const pct   = Math.round((count / maxCompletions) * 100);
                  return (
                    <div key={lesson.id} className="flex items-center gap-3 py-2">
                      <div className="size-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-panel-2 text-ink-dim">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn("text-[12px] truncate mb-1", lesson.published ? "text-ink-mid" : "text-ink-dim")}>
                          {lesson.title}
                          {!lesson.published && <span className="ml-1.5 text-[10px] text-coral">draft</span>}
                        </div>
                        <div className="relative h-1 rounded-full overflow-hidden bg-track">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: course.color }}
                          />
                        </div>
                      </div>
                      <span className="w-8 text-right tabular-nums text-[12px] font-semibold shrink-0 text-ink-mid">
                        {count}
                      </span>
                      <Link
                        href={`/admin/academy/courses/${course.id}/lessons/${lesson.id}`}
                        className="shrink-0 p-1 rounded-lg hover:opacity-70 transition-opacity text-ink-dim"
                      >
                        <span className="material-symbols-rounded text-[16px]">edit</span>
                      </Link>
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
