"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

interface Lesson {
  id: string; slug: string; title: string; duration: string;
  body: string | null; summary: string; points: string[];
  videoUrl: string | null; published: boolean; order: number;
}

const DRAFT_KEY = (id: string) => `smfx_lesson_draft_${id}`;

export function LessonEditorClient({ courseId, lesson }: { courseId: string; lesson: Lesson }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title,     setTitle]     = useState(lesson.title);
  const [duration,  setDuration]  = useState(lesson.duration);
  const [body,      setBody]      = useState(() => {
    if (typeof window === "undefined") return lesson.body ?? "";
    const draft = localStorage.getItem(DRAFT_KEY(lesson.id));
    return draft ?? (lesson.body ?? "");
  });
  const [summary,   setSummary]   = useState(lesson.summary);
  const [videoUrl,  setVideoUrl]  = useState(lesson.videoUrl ?? "");
  const [published, setPublished] = useState(lesson.published);
  const [tab,       setTab]       = useState<"edit" | "preview">("edit");
  const [saved,     setSaved]     = useState(false);
  const [isDirty,   setIsDirty]   = useState(false);

  // Auto-save draft every 10 s
  useEffect(() => {
    const t = setInterval(() => {
      if (isDirty) {
        localStorage.setItem(DRAFT_KEY(lesson.id), body);
        setIsDirty(false);
      }
    }, 10_000);
    return () => clearInterval(t);
  }, [isDirty, body, lesson.id]);

  function handleBodyChange(val: string) {
    setBody(val);
    setIsDirty(true);
  }

  async function saveLesson() {
    startTransition(async () => {
      await fetch(`/api/academy/admin/courses/${courseId}/lessons/${lesson.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title, duration, body, summary, videoUrl: videoUrl || null, published }),
      });
      localStorage.removeItem(DRAFT_KEY(lesson.id));
      setIsDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    });
  }

  // Simple markdown-to-html for preview
  function renderPreview(md: string) {
    return md
      .replace(/^# (.+)$/gm,   "<h1 style='font-size:22px;font-weight:700;margin:1.2em 0 0.4em;'>$1</h1>")
      .replace(/^## (.+)$/gm,  "<h2 style='font-size:17px;font-weight:700;margin:1em 0 0.3em;'>$1</h2>")
      .replace(/^### (.+)$/gm, "<h3 style='font-size:14px;font-weight:700;margin:0.8em 0 0.2em;'>$1</h3>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g,     "<em>$1</em>")
      .replace(/^- (.+)$/gm,   "<li style='margin-bottom:4px;'>$1</li>")
      .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m) => `<ul style='padding-left:20px;margin:0.5em 0;'>${m}</ul>`)
      .replace(/\n{2,}/g, "</p><p style='margin:0.6em 0;'>")
      .replace(/^(?!<[a-z])(.+)$/gm, (line) => {
        if (/^<(h[1-3]|ul|li|p)/.test(line)) return line;
        return `<p style='margin:0.6em 0;'>${line}</p>`;
      })
      .replace(/<p style='[^']*'><\/p>/g, "");
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Top bar */}
      <div className="rounded-2xl p-4 flex flex-wrap items-center gap-4 bg-panel shadow-md">
        <div className="flex-1 min-w-[200px] flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-ink-dim">Title</label>
          <input
            className="rounded-xl px-3 py-2 text-[14px] font-semibold outline-none transition-shadow shadow-[inset_0_1px_3px_rgba(0,0,0,0.12)] focus:shadow-[inset_0_1px_3px_rgba(0,0,0,0.12),0_0_0_2px_var(--teal)] bg-panel-2 text-ink-strong"
            value={title} onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-ink-dim">Duration</label>
          <input
            className="rounded-xl px-3 py-2 text-[13.5px] outline-none w-24 transition-shadow shadow-[inset_0_1px_3px_rgba(0,0,0,0.12)] focus:shadow-[inset_0_1px_3px_rgba(0,0,0,0.12),0_0_0_2px_var(--teal)] bg-panel-2 text-ink-strong"
            placeholder="18 min"
            value={duration} onChange={(e) => setDuration(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-ink-dim">Video URL</label>
          <input
            className="rounded-xl px-3 py-2 text-[13.5px] outline-none w-48 transition-shadow shadow-[inset_0_1px_3px_rgba(0,0,0,0.12)] focus:shadow-[inset_0_1px_3px_rgba(0,0,0,0.12),0_0_0_2px_var(--teal)] bg-panel-2 text-ink-strong"
            placeholder="https://…"
            value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 self-end pb-2">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          <span className="text-[13px] text-ink-mid">Published</span>
        </label>

        <button
          type="button"
          disabled={isPending}
          onClick={saveLesson}
          className={cn("self-end px-5 py-2 rounded-xl text-[13.5px] font-semibold transition-all bg-teal text-white", isPending && "opacity-70")}
        >
          {saved ? "Saved ✓" : isPending ? "Saving…" : "Save lesson"}
        </button>
      </div>

      {/* Summary */}
      <div className="rounded-2xl p-4 flex flex-col gap-1.5 bg-panel shadow-md">
        <label className="text-[12px] font-semibold text-ink-mid">Summary (shown on lesson card)</label>
        <input
          className="rounded-xl px-3 py-2 text-[13.5px] outline-none transition-shadow shadow-[inset_0_1px_3px_rgba(0,0,0,0.12)] focus:shadow-[inset_0_1px_3px_rgba(0,0,0,0.12),0_0_0_2px_var(--teal)] bg-panel-2 text-ink-strong"
          value={summary} onChange={(e) => setSummary(e.target.value)}
        />
      </div>

      {/* Body editor */}
      <div className="rounded-2xl overflow-hidden bg-panel shadow-md">
        {/* Tab bar */}
        <div className="flex items-center gap-0 px-4 bg-panel-2">
          {(["edit", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-3 text-[13px] font-semibold capitalize transition-all border-b-2 -mb-px",
                tab === t ? "border-teal text-teal" : "border-transparent text-ink-dim"
              )}
            >
              {t}
            </button>
          ))}
          {isDirty && (
            <span className="ml-auto text-[11.5px] text-gold">Unsaved draft…</span>
          )}
        </div>

        {tab === "edit" ? (
          <textarea
            className="w-full outline-none resize-none text-[13px] p-5 min-h-[600px] leading-[1.7] bg-panel text-ink-strong"
            placeholder="Write lesson content in Markdown…"
            value={body}
            onChange={(e) => handleBodyChange(e.target.value)}
          />
        ) : (
          <div
            className="p-6 prose-lesson min-h-[600px] leading-[1.8] text-[14px] text-ink-mid"
            dangerouslySetInnerHTML={{ __html: renderPreview(body) }}
          />
        )}
      </div>
    </div>
  );
}
