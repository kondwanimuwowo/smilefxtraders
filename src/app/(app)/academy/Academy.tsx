"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import { Icon, Chip, Button } from "@/components/ui";

// ── Course data ───────────────────────────────────────────────────────────────

type PlanTier = "free" | "pro" | "funded";

interface Lesson {
  id:       string;
  title:    string;
  duration: string;
}

interface Course {
  id:       string;
  title:    string;
  sub:      string;
  icon:     string;
  tier:     PlanTier;
  lessons:  Lesson[];
  color:    string;
}

const COURSES: Course[] = [
  {
    id: "c01", title: "Foundations of Smart Money",
    sub: "The complete beginner-to-intermediate ICT curriculum. Market structure, liquidity, and the three key models.",
    icon: "school", tier: "free", color: "var(--teal)",
    lessons: [
      { id: "l01", title: "What is Smart Money? The institutional edge explained",   duration: "18 min" },
      { id: "l02", title: "Market structure: BOS, CHoCH, and why they matter",        duration: "22 min" },
      { id: "l03", title: "Liquidity: equal highs, equal lows, and stop hunts",       duration: "20 min" },
      { id: "l04", title: "Fair Value Gaps — identifying and trading imbalances",      duration: "25 min" },
      { id: "l05", title: "Order Blocks — the last opposing candle before the BOS",   duration: "19 min" },
      { id: "l06", title: "Sessions and killzones — when to trade and when to wait",  duration: "14 min" },
    ],
  },
  {
    id: "c02", title: "Advanced SMC Models",
    sub: "Deep dives into every model in the Smile FX rulebook: Turtle Soup, SMT, OB+FVG, and BOS retrace.",
    icon: "psychology", tier: "pro", color: "var(--gold)",
    lessons: [
      { id: "l07", title: "Liquidity Sweep → FVG: the highest-probability setup",       duration: "28 min" },
      { id: "l08", title: "OB + BOS: catching institutional order flow",                duration: "24 min" },
      { id: "l09", title: "Turtle Soup: fading breakouts the smart money way",          duration: "21 min" },
      { id: "l10", title: "SMT Divergence: reading correlated pairs for confirmation",  duration: "30 min" },
      { id: "l11", title: "OB + FVG confluence: the double-zone entry",                 duration: "19 min" },
      { id: "l12", title: "BOS + retrace: entering on the pullback with confidence",    duration: "17 min" },
    ],
  },
  {
    id: "c03", title: "Risk Management & Psychology",
    sub: "The part most traders ignore. Position sizing, risk per trade, drawdown management, and emotional control.",
    icon: "health_and_safety", tier: "pro", color: "var(--coral)",
    lessons: [
      { id: "l13", title: "The 0.5% rule: why less risk = more profit long term",    duration: "16 min" },
      { id: "l14", title: "Position sizing with fixed fractional risk",               duration: "14 min" },
      { id: "l15", title: "Drawdown: how much is too much and when to stop",          duration: "18 min" },
      { id: "l16", title: "The revenge trade — recognising and breaking the pattern", duration: "20 min" },
      { id: "l17", title: "Trading journal psychology: honest review practice",       duration: "15 min" },
    ],
  },
  {
    id: "c04", title: "Reading the COT Report",
    sub: "Use institutional positioning data to confirm HTF bias before you trade. A weekly edge most retailers never use.",
    icon: "bar_chart", tier: "pro", color: "var(--navy)",
    lessons: [
      { id: "l18", title: "What the CFTC data tells us that price charts don't",           duration: "22 min" },
      { id: "l19", title: "Non-commercial net positions: how to find extreme readings",    duration: "18 min" },
      { id: "l20", title: "Combining COT + SMC structure: the institutional bias trade",   duration: "26 min" },
    ],
  },
  {
    id: "c05", title: "Live Trade Reviews with Kondwani",
    sub: "Kondwani walks through real trades — his alerts, your submitted trades, winners and losers all reviewed live.",
    icon: "videocam", tier: "pro", color: "var(--teal)",
    lessons: [
      { id: "l21", title: "June 2026 week 1 — XAUUSD London sweep reviewed",        duration: "34 min" },
      { id: "l22", title: "May 2026 week 4 — GBPUSD shorting into premium OB",      duration: "29 min" },
      { id: "l23", title: "May 2026 week 3 — NAS100 BOS retrace, what I saw",       duration: "31 min" },
    ],
  },
  {
    id: "c06", title: "Prop Firm Preparation",
    sub: "Everything you need to pass a funded evaluation: consistency rules, max drawdown rules, and a 30-day plan.",
    icon: "workspace_premium", tier: "funded", color: "var(--gold)",
    lessons: [
      { id: "l24", title: "Choosing the right prop firm for an SMC trader",              duration: "20 min" },
      { id: "l25", title: "The 30-day challenge plan: 0.5% risk, 5 trades per week",     duration: "25 min" },
      { id: "l26", title: "Passing the evaluation: rules, mindset, and daily process",   duration: "22 min" },
      { id: "l27", title: "After the evaluation: scaling, payouts, and the next step",   duration: "18 min" },
    ],
  },
];

// ── Progress hooks ────────────────────────────────────────────────────────────

function useProgress() {
  return useQuery({
    queryKey: ["academy-progress"],
    queryFn: async () => {
      const res = await fetch("/api/academy/progress");
      if (!res.ok) return [] as string[];
      return res.json() as Promise<string[]>;
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
      queryClient.setQueryData<string[]>(["academy-progress"], (old = []) =>
        completed ? [...new Set([...old, lessonId])] : old.filter((id) => id !== lessonId)
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["academy-progress"] }),
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<PlanTier, { label: string; color: string; bg: string }> = {
  free:   { label: "Free",         color: "var(--ink-dim)",      bg: "var(--panel-2)"          },
  pro:    { label: "Pro",          color: "var(--teal)",         bg: "rgba(8,174,170,0.12)"    },
  funded: { label: "Funded Track", color: "var(--gold)",         bg: "rgba(248,185,61,0.12)"   },
};

function tierAccess(userPlan: PlanTier, courseTier: PlanTier): boolean {
  const rank = { free: 0, pro: 1, funded: 2 };
  return rank[userPlan] >= rank[courseTier];
}

// ── Course card ───────────────────────────────────────────────────────────────

function CourseCard({ course, canAccess, onOpen, completedIds }: { course: Course; canAccess: boolean; onOpen: () => void; completedIds: string[] }) {
  const done      = course.lessons.filter((l) => completedIds.includes(l.id)).length;
  const total     = course.lessons.length;
  const pct       = Math.round((done / total) * 100);
  const tierCfg   = TIER_CONFIG[course.tier];

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all cursor-pointer group"
      style={{
        background: "var(--panel)",
        border: "1px solid var(--line)",
        opacity: canAccess ? 1 : 0.65,
      }}
      onClick={canAccess ? onOpen : undefined}
    >
      {/* Top colour bar */}
      <div className="h-1.5" style={{ background: course.color }} />

      <div className="px-5 pt-4 pb-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div
            className="size-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${course.color}20` }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 22, color: course.color }}>{course.icon}</span>
          </div>
          <span
            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
            style={{ background: tierCfg.bg, color: tierCfg.color }}
          >
            {tierCfg.label}
          </span>
        </div>

        <h3 className="font-display font-bold text-[15px] mb-1.5 leading-snug" style={{ color: "var(--ink-strong)" }}>
          {course.title}
        </h3>
        <p className="text-[12.5px] leading-relaxed mb-3" style={{ color: "var(--ink-dim)" }}>
          {course.sub}
        </p>

        <div className="flex items-center gap-3 mb-3">
          <span className="text-[12px]" style={{ color: "var(--ink-dim)" }}>
            {total} lessons
          </span>
          {canAccess && done > 0 && (
            <span className="text-[12px] font-medium" style={{ color: "var(--teal)" }}>
              {done}/{total} complete
            </span>
          )}
        </div>

        {/* Progress bar */}
        {canAccess ? (
          <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: "var(--track)" }}>
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: course.color }}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Icon name="lock" size={14} style={{ color: "var(--ink-dim)" }} />
            <span className="text-[12px]" style={{ color: "var(--ink-dim)" }}>
              {tierCfg.label} plan required
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Lesson list ───────────────────────────────────────────────────────────────

function LessonList({ course, onBack, completedIds }: { course: Course; onBack: () => void; completedIds: string[] }) {
  const [playing, setPlaying]   = useState<string | null>(null);
  const { mutate: markComplete } = useMarkComplete();

  return (
    <div>
      <button type="button" onClick={onBack} className="flex items-center gap-2 mb-5 text-[13px] font-medium" style={{ color: "var(--ink-dim)" }}>
        <Icon name="arrow_back" size={17} />
        Back to Academy
      </button>

      <div className="flex items-start gap-4 mb-6">
        <div
          className="size-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${course.color}20` }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 26, color: course.color }}>{course.icon}</span>
        </div>
        <div>
          <h2 className="font-display font-bold text-[22px]" style={{ color: "var(--ink-strong)", letterSpacing: "-0.02em" }}>
            {course.title}
          </h2>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--ink-dim)" }}>{course.sub}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {course.lessons.map((lesson, i) => {
          const isDone = completedIds.includes(lesson.id);
          return (
            <div
              key={lesson.id}
              className="rounded-2xl border overflow-hidden"
              style={{
                background: playing === lesson.id ? "rgba(8,174,170,0.07)" : "var(--panel)",
                borderColor: playing === lesson.id ? "rgba(8,174,170,0.3)" : "var(--line)",
              }}
            >
              <button
                type="button"
                onClick={() => setPlaying(playing === lesson.id ? null : lesson.id)}
                className="flex items-center gap-4 px-5 py-4 text-left w-full transition-all"
              >
                <div
                  className="size-8 rounded-full flex items-center justify-center shrink-0 text-[13px] font-bold"
                  style={{
                    background: isDone ? "var(--teal)" : "var(--panel-2)",
                    color: isDone ? "#fff" : "var(--ink-dim)",
                  }}
                >
                  {isDone ? <Icon name="check" size={16} style={{ color: "#fff" }} /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold leading-snug" style={{ color: "var(--ink-strong)" }}>
                    {lesson.title}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[12px]" style={{ color: "var(--ink-dim)" }}>{lesson.duration}</span>
                  <span className="material-symbols-rounded text-[18px]" style={{ color: "var(--ink-dim)" }}>
                    {playing === lesson.id ? "expand_less" : "chevron_right"}
                  </span>
                </div>
              </button>

              {playing === lesson.id && (
                <div className="px-5 pb-4">
                  <div
                    className="rounded-xl flex items-center justify-center gap-3 py-8 mb-3"
                    style={{ background: "var(--panel-2)", border: "1px solid var(--line)" }}
                  >
                    <Icon name="play_circle" size={36} fill style={{ color: "var(--teal)" }} />
                    <span className="text-[13px] font-medium" style={{ color: "var(--ink-dim)" }}>
                      {lesson.id.startsWith("l") ? "Video coming soon — instructor will upload" : "Video player"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => markComplete({ lessonId: lesson.id, completed: !isDone })}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-semibold transition-all"
                    style={isDone
                      ? { background: "rgba(8,174,170,0.1)", color: "var(--teal)", border: "1px solid rgba(8,174,170,0.2)" }
                      : { background: "var(--panel-2)", color: "var(--ink-mid)", border: "1px solid var(--line)" }
                    }
                  >
                    <Icon name={isDone ? "check_circle" : "radio_button_unchecked"} size={16} fill={isDone} />
                    {isDone ? "Mark incomplete" : "Mark as complete"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Academy ───────────────────────────────────────────────────────────────────

export function Academy() {
  const { user }    = useStore();
  const plan        = user?.plan ?? "free";
  const [open, setOpen] = useState<Course | null>(null);
  const { data: completedIds = [] } = useProgress();

  if (open) {
    return (
      <div className="view">
        <LessonList course={open} onBack={() => setOpen(null)} completedIds={completedIds} />
      </div>
    );
  }

  const freeCourses = COURSES.filter((c) => c.tier === "free");
  const proCourses  = COURSES.filter((c) => c.tier === "pro");
  const fundCourses = COURSES.filter((c) => c.tier === "funded");

  return (
    <div className="view">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-bold" style={{ fontSize: 24, letterSpacing: "-0.02em", color: "var(--ink-strong)" }}>
            Academy
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--ink-dim)" }}>
            Structured SMC education from Foundations to Prop Firm readiness.
          </p>
        </div>
        {plan === "free" && (
          <Button type="button" variant="primary" icon="workspace_premium">
            <a href="/pricing" style={{ color: "inherit", textDecoration: "none" }}>Upgrade to Pro</a>
          </Button>
        )}
      </div>

      {/* Free tier */}
      <section className="mb-7">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-display font-semibold text-[16px]" style={{ color: "var(--ink-strong)" }}>Foundations</span>
          <Chip tone="neutral">Free</Chip>
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(340px, 100%), 1fr))" }}>
          {freeCourses.map((c) => (
            <CourseCard key={c.id} course={c} canAccess={tierAccess(plan, c.tier)} onOpen={() => setOpen(c)} completedIds={completedIds} />
          ))}
        </div>
      </section>

      {/* Pro tier */}
      <section className="mb-7">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-display font-semibold text-[16px]" style={{ color: "var(--ink-strong)" }}>Pro Trader</span>
          <Chip tone="teal">Pro plan</Chip>
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(340px, 100%), 1fr))" }}>
          {proCourses.map((c) => (
            <CourseCard key={c.id} course={c} canAccess={tierAccess(plan, c.tier)} onOpen={() => setOpen(c)} completedIds={completedIds} />
          ))}
        </div>
      </section>

      {/* Funded track tier */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="font-display font-semibold text-[16px]" style={{ color: "var(--ink-strong)" }}>Funded Track</span>
          <Chip tone="gold">Funded plan</Chip>
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(340px, 100%), 1fr))" }}>
          {fundCourses.map((c) => (
            <CourseCard key={c.id} course={c} canAccess={tierAccess(plan, c.tier)} onOpen={() => setOpen(c)} completedIds={completedIds} />
          ))}
        </div>
      </section>
    </div>
  );
}
