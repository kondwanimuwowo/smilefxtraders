"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { Icon } from "@/components/ui";

interface Lesson {
  id: string; slug: string; title: string; duration: string;
  order: number; published: boolean;
}
interface Course {
  id: string; slug: string; title: string; description: string;
  tier: string; icon: string; color: string; order: number;
  published: boolean; lessons: Lesson[];
}

// COLOR_OPTIONS values feed runtime string concatenation below (`${color}20`
// alpha suffix, dynamic `${c}` swatch backgrounds/outlines in the icon and
// colour pickers) - per this migration's rule against constructing Tailwind
// classes via string interpolation, that whole picker section stays inline.
const ICON_OPTIONS  = ["school", "psychology", "health_and_safety", "bar_chart", "videocam", "workspace_premium", "star", "trending_up"];
const COLOR_OPTIONS = ["var(--teal)", "var(--gold)", "var(--coral)", "var(--navy)", "var(--teal-bright)"];
const TIER_OPTIONS  = [
  { value: "free", label: "Free" },
  { value: "edge", label: "Edge" },
  { value: "pro",  label: "Pro" },
];

export function CourseEditorClient({ course }: { course: Course }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title,       setTitle]       = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [tier,        setTier]        = useState(course.tier);
  const [icon,        setIcon]        = useState(course.icon);
  const [color,       setColor]       = useState(course.color);
  const [order,       setOrder]       = useState(course.order);
  const [published,   setPublished]   = useState(course.published);
  const [saved,       setSaved]       = useState(false);

  async function saveCourse() {
    startTransition(async () => {
      await fetch(`/api/academy/admin/courses/${course.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title, description, tier, icon, color, order, published }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    });
  }

  async function addLesson() {
    const slug = `lesson-${Date.now()}`;
    const res  = await fetch(`/api/academy/admin/courses/${course.id}/lessons`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ slug, title: "New lesson", order: course.lessons.length + 1 }),
    });
    if (res.ok) {
      const lesson = await res.json() as Lesson;
      router.push(`/admin/academy/courses/${course.id}/lessons/${lesson.id}`);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[380px_minmax(0,1fr)] gap-5">
      {/* Course fields */}
      <div className="rounded-2xl p-5 flex flex-col gap-4 bg-panel border border-line">
        <h2 className="font-display font-medium text-[16px] text-ink-strong">Course settings</h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-ink-mid">Title</span>
          <input
            className="rounded-xl px-3 py-2 text-[13.5px] outline-none bg-panel-2 border border-line text-ink-strong"
            value={title} onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-ink-mid">Description</span>
          <textarea
            rows={3}
            className="rounded-xl px-3 py-2 text-[13.5px] outline-none resize-none bg-panel-2 border border-line text-ink-strong"
            value={description} onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-ink-mid">Tier</span>
          <select
            className="rounded-xl px-3 py-2 text-[13.5px] outline-none bg-panel-2 border border-line text-ink-strong"
            value={tier} onChange={(e) => setTier(e.target.value)}
          >
            {TIER_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-ink-mid">Icon</span>
          <div className="flex flex-wrap gap-2">
            {ICON_OPTIONS.map((ic) => (
              <button
                key={ic} type="button"
                onClick={() => setIcon(ic)}
                className="size-9 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: icon === ic ? `${color}20` : "var(--panel-2)",
                  border: `1px solid ${icon === ic ? color : "var(--line)"}`,
                }}
              >
                <Icon name={ic} size={18} style={{ color: icon === ic ? color : "var(--ink-dim)" }} />
              </button>
            ))}
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-ink-mid">Colour</span>
          <div className="flex gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c} type="button"
                onClick={() => setColor(c)}
                className="size-7 rounded-full transition-all"
                style={{
                  background: `${c}`,
                  outline: color === c ? `2px solid ${c}` : "none",
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="rounded" />
          <span className="text-[13px] text-ink-mid">Published (visible to students)</span>
        </label>

        <button
          type="button"
          disabled={isPending}
          onClick={saveCourse}
          className={cn("w-full py-2 rounded-xl text-[13.5px] font-semibold transition-all text-white bg-teal", isPending && "opacity-70")}
        >
          {saved ? "Saved ✓" : isPending ? "Saving…" : "Save course"}
        </button>
      </div>

      {/* Lessons list */}
      <div className="rounded-2xl p-5 bg-panel border border-line">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-medium text-[16px] text-ink-strong">
            Lessons <span className="text-ink-dim">({course.lessons.length})</span>
          </h2>
          <button
            type="button"
            onClick={addLesson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-semibold bg-[rgba(8,174,170,0.1)] text-teal border border-[rgba(8,174,170,0.2)]"
          >
            <Icon name="add" size={15} />
            Add lesson
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {course.lessons.map((lesson, i) => (
            <Link
              key={lesson.id}
              href={`/admin/academy/courses/${course.id}/lessons/${lesson.id}`}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:opacity-80 bg-panel-2 border border-line"
            >
              <div className="size-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 bg-track text-ink-dim">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate text-ink-strong">{lesson.title}</div>
                <div className="text-[11.5px] text-ink-dim">{lesson.duration}</div>
              </div>
              {!lesson.published && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 bg-[rgba(234,82,61,0.1)] text-coral">
                  Draft
                </span>
              )}
              <Icon name="chevron_right" size={17} className="shrink-0 text-ink-dim" />
            </Link>
          ))}

          {course.lessons.length === 0 && (
            <div className="text-center py-8 text-[13px] text-ink-dim">
              No lessons yet. Click "Add lesson" to create the first one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
