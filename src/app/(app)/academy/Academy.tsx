"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import { Icon, Chip, Button } from "@/components/ui";

// ── Types ─────────────────────────────────────────────────────────────────────

type PlanTier = "free" | "edge" | "pro";

interface DBLesson {
  id:       string;
  slug:     string;
  title:    string;
  duration: string;
  body:     string | null;
  summary:  string;
  points:   string[];
  order:    number;
}

interface DBCourse {
  id:          string;
  slug:        string;
  title:       string;
  description: string;
  tier:        string;
  icon:        string;
  // raw var(--x) string chosen from CourseEditorClient's COLOR_OPTIONS,
  // consumed via `${course.color}NN` alpha-suffix concatenation throughout
  // this file - can't be a static Tailwind class, stays inline everywhere.
  color:       string;
  order:       number;
  lessons:     DBLesson[];
}

// ── Data hook ─────────────────────────────────────────────────────────────────

function useCourses() {
  return useQuery({
    queryKey: ["academy-courses"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<{ courses: DBCourse[]; completedIds: string[] }> => {
      const res = await fetch("/api/academy/courses");
      if (!res.ok) return { courses: [], completedIds: [] };
      return res.json();
    },
  });
}

function useMarkComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, completed }: { lessonId: string; completed: boolean }) => {
      await fetch("/api/academy/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, completed }),
      });
    },
    onMutate: async ({ lessonId, completed }) => {
      await queryClient.cancelQueries({ queryKey: ["academy-courses"] });
      const prev = queryClient.getQueryData<{ courses: DBCourse[]; completedIds: string[] }>(["academy-courses"]);
      queryClient.setQueryData<{ courses: DBCourse[]; completedIds: string[] }>(["academy-courses"], (old) => {
        if (!old) return old;
        const ids = completed
          ? [...new Set([...old.completedIds, lessonId])]
          : old.completedIds.filter((id) => id !== lessonId);
        return { ...old, completedIds: ids };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["academy-courses"], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["academy-courses"] }),
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<PlanTier, { label: string; textCls: string; badgeCls: string }> = {
  free: { label: "Free", textCls: "text-ink-dim", badgeCls: "text-ink-dim bg-panel-2"              },
  edge: { label: "Edge", textCls: "text-teal",    badgeCls: "text-teal bg-[rgba(8,174,170,0.12)]"  },
  pro:  { label: "Pro",  textCls: "text-gold",    badgeCls: "text-gold bg-[rgba(248,185,61,0.12)]" },
};

function tierAccess(userPlan: PlanTier, courseTier: string): boolean {
  const rank: Record<string, number> = { free: 0, edge: 1, pro: 2 };
  return (rank[userPlan] ?? 0) >= (rank[courseTier] ?? 0);
}

// ── Simple markdown renderer ──────────────────────────────────────────────────

function renderMarkdown(md: string): string {
  return md
    .replace(/^# (.+)$/gm,   "<h1>$1</h1>")
    .replace(/^## (.+)$/gm,  "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,     "<em>$1</em>")
    .replace(/^- (.+)$/gm,   "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/g, (_, head, rows) => {
      const th = head.split("|").filter(Boolean).map((h: string) => `<th>${h.trim()}</th>`).join("");
      const tr = rows.trim().split("\n").map((r: string) =>
        `<tr>${r.split("|").filter(Boolean).map((c: string) => `<td>${c.trim()}</td>`).join("")}</tr>`
      ).join("");
      return `<table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
    })
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/^(?!<[a-z])(.+)$/gm, "$1")
    .replace(/^(.+[^>])$/gm, (line) => {
      if (/^<(h[1-3]|ul|li|p|table|thead|tbody|tr|th|td)/.test(line)) return line;
      return `<p>${line}</p>`;
    })
    .replace(/<p><\/p>/g, "")
    .replace(/<p>(<[a-z])/g, "$1")
    .replace(/(<\/[a-z0-9]+>)<\/p>/g, "$1");
}

// ── Course card ───────────────────────────────────────────────────────────────

function CourseCard({
  course, canAccess, onOpen, onUpgrade, completedIds,
}: {
  course:       DBCourse;
  canAccess:    boolean;
  onOpen:       () => void;
  onUpgrade:    () => void;
  completedIds: string[];
}) {
  const done    = course.lessons.filter((l) => completedIds.includes(l.id)).length;
  const total   = course.lessons.length;
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0;
  const tierCfg = TIER_CONFIG[course.tier as PlanTier] ?? TIER_CONFIG.free;
  const complete = canAccess && done === total && total > 0;

  return (
    <div
      className={`rounded-2xl overflow-hidden transition-all bg-panel ${canAccess ? "cursor-pointer" : "cursor-default opacity-65"}`}
      style={{ border: complete ? `1px solid ${course.color}55` : "1px solid var(--line)" }}
      onClick={canAccess ? onOpen : onUpgrade}
    >
      {complete && (
        <div
          className="flex items-center gap-2 px-5 py-2 text-[11.5px] font-semibold"
          style={{ background: `${course.color}14`, borderBottom: `1px solid ${course.color}30`, color: course.color }}
        >
          <Icon name="verified" size={14} fill />
          Course complete
        </div>
      )}

      <div className="h-1.5" style={{ background: course.color }} />

      <div className="px-5 pt-4 pb-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div
            className="size-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${course.color}20` }}
          >
            <Icon name={course.icon} size={22} style={{ color: course.color }} />
          </div>
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${tierCfg.badgeCls}`}>
            {tierCfg.label}
          </span>
        </div>

        <h3 className="font-display font-medium text-[15px] mb-1.5 leading-snug text-ink-strong">
          {course.title}
        </h3>
        <p className="text-[12.5px] leading-relaxed mb-3 text-ink-dim">
          {course.description}
        </p>

        <div className="flex items-center gap-3 mb-3">
          <span className="text-[12px] text-ink-dim">{total} lessons</span>
          {canAccess && done > 0 && (
            <span className="text-[12px] font-medium" style={{ color: course.color }}>{done}/{total} complete</span>
          )}
        </div>

        {canAccess ? (
          <div className="relative h-1.5 rounded-full overflow-hidden bg-track">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: course.color }}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onUpgrade(); }}
            className={`flex items-center gap-1.5 text-[12px] font-semibold transition-opacity hover:opacity-70 ${tierCfg.textCls}`}
          >
            <Icon name="lock" size={14} />
            Upgrade to {tierCfg.label}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Lesson body viewer ────────────────────────────────────────────────────────

function LessonBody({ body }: { body: string | null }) {
  if (!body) {
    return (
      <div className="rounded-xl flex flex-col items-center justify-center gap-2 py-10 bg-panel-2 border border-line">
        <Icon name="play_circle" size={44} fill className="text-teal" />
        <span className="text-[13px] font-medium text-ink-dim">
          Video coming soon, instructor will upload
        </span>
      </div>
    );
  }

  return (
    <div
      className="prose-lesson rounded-xl px-6 py-5 bg-panel-2 border border-line"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
    />
  );
}

// ── Lesson list ───────────────────────────────────────────────────────────────

function LessonList({
  course, onBack, completedIds,
}: {
  course:       DBCourse;
  onBack:       () => void;
  completedIds: string[];
}) {
  const [playing, setPlaying]    = useState<string | null>(null);
  const { mutate: markComplete } = useMarkComplete();

  const done  = course.lessons.filter((l) => completedIds.includes(l.id)).length;
  const total = course.lessons.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  function openLesson(id: string) {
    setPlaying(id);
    setTimeout(() => {
      document.getElementById(`lesson-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  return (
    <div>
      <button type="button" onClick={onBack} className="flex items-center gap-2 mb-5 text-[13px] font-medium text-ink-dim">
        <Icon name="arrow_back" size={17} />
        Back to Academy
      </button>

      <div className="flex items-start gap-4 mb-4">
        <div
          className="size-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${course.color}20` }}
        >
          <Icon name={course.icon} size={26} style={{ color: course.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-medium text-[22px] tracking-[-0.02em] text-ink-strong">
            {course.title}
          </h2>
          <p className="text-[13px] mt-0.5 text-ink-dim">{course.description}</p>
        </div>
      </div>

      <div className="rounded-2xl px-5 py-3.5 mb-5 flex items-center gap-4 bg-panel border border-line">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-semibold text-ink-mid">
              {done === total && total > 0 ? "Course complete" : `${done} of ${total} lessons complete`}
            </span>
            <span className="text-[12px] font-bold" style={{ color: course.color }}>{pct}%</span>
          </div>
          <div className="relative h-1.5 rounded-full overflow-hidden bg-track">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: course.color }}
            />
          </div>
        </div>
        {done === total && total > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <Icon name="verified" size={16} fill style={{ color: course.color }} />
            <span className="text-[12.5px] font-semibold" style={{ color: course.color }}>Complete</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {course.lessons.map((lesson, i) => {
          const isDone    = completedIds.includes(lesson.id);
          const isPlaying = playing === lesson.id;
          const next      = course.lessons[i + 1] ?? null;

          return (
            <div
              id={`lesson-${lesson.id}`}
              key={lesson.id}
              className={`rounded-2xl border overflow-hidden ${
                isPlaying ? "bg-[rgba(8,174,170,0.07)] border-[rgba(8,174,170,0.3)]" : "bg-panel border-line"
              }`}
            >
              <button
                type="button"
                onClick={() => setPlaying(isPlaying ? null : lesson.id)}
                className="flex items-center gap-4 px-5 py-4 text-left w-full transition-all"
              >
                <div
                  className={`size-8 rounded-full flex items-center justify-center shrink-0 text-[13px] font-bold ${
                    isDone ? "bg-teal text-white" : "bg-panel-2 text-ink-dim"
                  }`}
                >
                  {isDone ? <Icon name="check" size={16} className="text-white" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold leading-snug text-ink-strong">
                    {lesson.title}
                  </div>
                  {lesson.summary && (
                    <div className="text-[11.5px] mt-0.5 truncate text-ink-dim">
                      {lesson.summary}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[12px] text-ink-dim">{lesson.duration}</span>
                  <Icon name={isPlaying ? "expand_less" : "chevron_right"} size={18} className="text-ink-dim" />
                </div>
              </button>

              {isPlaying && (
                <div className="px-5 pb-5">
                  <div className="mb-4">
                    <LessonBody body={lesson.body} />
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => markComplete({ lessonId: lesson.id, completed: !isDone })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-semibold transition-all border ${
                        isDone
                          ? "bg-[rgba(8,174,170,0.1)] text-teal border-[rgba(8,174,170,0.2)]"
                          : "bg-panel-2 text-ink-mid border-line"
                      }`}
                    >
                      <Icon name={isDone ? "check_circle" : "radio_button_unchecked"} size={16} fill={isDone} />
                      {isDone ? "Mark incomplete" : "Mark as complete"}
                    </button>

                    {next && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isDone) markComplete({ lessonId: lesson.id, completed: true });
                          openLesson(next.id);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12.5px] font-semibold ml-auto bg-teal text-white"
                      >
                        Next lesson
                        <Icon name="arrow_forward" size={15} className="text-white" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Progress banner ───────────────────────────────────────────────────────────

function ProgressBanner({ completedIds, totalLessons, isLoading }: { completedIds: string[]; totalLessons: number; isLoading: boolean }) {
  const done = completedIds.length;
  const pct  = totalLessons > 0 ? Math.round((done / totalLessons) * 100) : 0;

  if (isLoading) {
    return (
      <div className="rounded-2xl px-5 py-4 mb-6 animate-pulse bg-panel border border-line h-[72px]" />
    );
  }

  if (done === 0) return null;

  return (
    <div className="rounded-2xl px-5 py-4 mb-6 flex items-center gap-5 bg-panel border border-line">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[13px] font-semibold text-ink-strong">Your progress</span>
          <span className="font-display font-bold text-[13px] text-teal">
            {done} / {totalLessons} lessons
          </span>
        </div>
        <div className="relative h-2 rounded-full overflow-hidden bg-track">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 bg-teal"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-display font-bold text-[22px] tracking-[-0.03em] text-teal">{pct}%</div>
        <div className="text-[11px] text-ink-dim">complete</div>
      </div>
    </div>
  );
}

// ── Skeleton grid ─────────────────────────────────────────────────────────────

const COURSE_GRID_COLS = "grid-cols-[repeat(auto-fill,minmax(min(340px,100%),1fr))]";

function SkeletonGrid() {
  return (
    <div className={`grid gap-4 ${COURSE_GRID_COLS}`}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-2xl animate-pulse bg-panel border border-line h-[200px]" />
      ))}
    </div>
  );
}

// ── Academy ───────────────────────────────────────────────────────────────────

export function Academy() {
  const router  = useRouter();
  const { user } = useStore();
  const plan     = (user?.plan ?? "free") as PlanTier;
  const [open, setOpen] = useState<DBCourse | null>(null);

  const { data, isLoading } = useCourses();
  const courses      = data?.courses ?? [];
  const completedIds = data?.completedIds ?? [];
  const totalLessons = courses.reduce((a, c) => a + c.lessons.length, 0);

  function handleUpgrade() { router.push("/membership"); }

  if (open) {
    return (
      <div className="view">
        <LessonList course={open} onBack={() => setOpen(null)} completedIds={completedIds} />
      </div>
    );
  }

  const freeCourses = courses.filter((c) => c.tier === "free");
  const edgeCourses = courses.filter((c) => c.tier === "edge");
  const proCourses  = courses.filter((c) => c.tier === "pro");

  return (
    <div className="view">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-medium text-2xl tracking-[-0.02em] text-ink-strong">
            Academy
          </h1>
          <p className="text-[13px] mt-0.5 text-ink-dim">
            Structured SMC education from Foundations to Prop Firm readiness.
          </p>
        </div>
        {plan === "free" && (
          <Button type="button" variant="primary" icon="workspace_premium" onClick={handleUpgrade}>
            Upgrade to Pro
          </Button>
        )}
      </div>

      <ProgressBanner completedIds={completedIds} totalLessons={totalLessons} isLoading={isLoading} />

      {/* Free tier */}
      <section className="mb-7">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-display font-semibold text-[16px] text-ink-strong">Foundations</span>
          <Chip tone="neutral">Free</Chip>
        </div>
        {isLoading ? <SkeletonGrid /> : (
          <div className={`grid gap-4 ${COURSE_GRID_COLS}`}>
            {freeCourses.map((c) => (
              <CourseCard
                key={c.id} course={c}
                canAccess={tierAccess(plan, c.tier)}
                onOpen={() => setOpen(c)}
                onUpgrade={handleUpgrade}
                completedIds={completedIds}
              />
            ))}
          </div>
        )}
      </section>

      {/* Edge tier */}
      <section className="mb-7">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-display font-semibold text-[16px] text-ink-strong">Edge</span>
          <Chip tone="teal">Edge plan</Chip>
        </div>
        {isLoading ? <SkeletonGrid /> : (
          <div className={`grid gap-4 ${COURSE_GRID_COLS}`}>
            {edgeCourses.map((c) => (
              <CourseCard
                key={c.id} course={c}
                canAccess={tierAccess(plan, c.tier)}
                onOpen={() => setOpen(c)}
                onUpgrade={handleUpgrade}
                completedIds={completedIds}
              />
            ))}
          </div>
        )}
      </section>

      {/* Pro tier */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="font-display font-semibold text-[16px] text-ink-strong">Pro</span>
          <Chip tone="gold">Pro plan</Chip>
        </div>
        {isLoading ? <SkeletonGrid /> : (
          <div className={`grid gap-4 ${COURSE_GRID_COLS}`}>
            {proCourses.map((c) => (
              <CourseCard
                key={c.id} course={c}
                canAccess={tierAccess(plan, c.tier)}
                onOpen={() => setOpen(c)}
                onUpgrade={handleUpgrade}
                completedIds={completedIds}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
