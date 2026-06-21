"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TIER_OPTIONS  = [{ value: "free", label: "Free" }, { value: "pro", label: "Pro" }, { value: "funded", label: "Funded Track" }];
const ICON_OPTIONS  = ["school", "psychology", "health_and_safety", "bar_chart", "videocam", "workspace_premium", "star", "trending_up"];
const COLOR_OPTIONS = ["var(--teal)", "var(--gold)", "var(--coral)", "var(--navy)", "var(--teal-bright)"];

export default function NewCoursePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [slug,        setSlug]        = useState("");
  const [tier,        setTier]        = useState("pro");
  const [icon,        setIcon]        = useState("school");
  const [color,       setColor]       = useState("var(--teal)");
  const [error,       setError]       = useState("");

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slug) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  }

  async function create() {
    if (!title.trim() || !slug.trim()) { setError("Title and slug are required."); return; }
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/academy/admin/courses", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title, description, slug, tier, icon, color }),
      });
      if (!res.ok) { setError("Failed to create course."); return; }
      const course = await res.json() as { id: string };
      router.push(`/admin/academy/courses/${course.id}`);
    });
  }

  return (
    <div className="view">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/academy" className="flex items-center gap-1.5 text-[13px] font-medium hover:opacity-70" style={{ color: "var(--ink-dim)" }}>
          <span className="material-symbols-rounded text-[17px]">arrow_back</span>
          Course Builder
        </Link>
        <span style={{ color: "var(--line)" }}>›</span>
        <span className="text-[13px] font-medium" style={{ color: "var(--ink-strong)" }}>New course</span>
      </div>

      <div className="max-w-lg rounded-2xl p-6 flex flex-col gap-4" style={{ background: "var(--panel)", border: "1px solid var(--line)" }}>
        <h1 className="font-display font-bold text-[20px]" style={{ color: "var(--ink-strong)" }}>Create a new course</h1>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold" style={{ color: "var(--ink-mid)" }}>Title</span>
          <input className="rounded-xl px-3 py-2 text-[14px] outline-none" style={{ background: "var(--panel-2)", border: "1px solid var(--line)", color: "var(--ink-strong)" }}
            value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="e.g. Advanced SMC Models" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold" style={{ color: "var(--ink-mid)" }}>Slug</span>
          <input className="rounded-xl px-3 py-2 text-[14px] outline-none font-mono" style={{ background: "var(--panel-2)", border: "1px solid var(--line)", color: "var(--ink-strong)" }}
            value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="advanced-smc-models" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold" style={{ color: "var(--ink-mid)" }}>Description</span>
          <textarea rows={3} className="rounded-xl px-3 py-2 text-[13.5px] outline-none resize-none" style={{ background: "var(--panel-2)", border: "1px solid var(--line)", color: "var(--ink-strong)" }}
            value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold" style={{ color: "var(--ink-mid)" }}>Tier</span>
          <select className="rounded-xl px-3 py-2 text-[13.5px] outline-none" style={{ background: "var(--panel-2)", border: "1px solid var(--line)", color: "var(--ink-strong)" }}
            value={tier} onChange={(e) => setTier(e.target.value)}>
            {TIER_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold" style={{ color: "var(--ink-mid)" }}>Icon</span>
          <div className="flex flex-wrap gap-2">
            {ICON_OPTIONS.map((ic) => (
              <button key={ic} type="button" onClick={() => setIcon(ic)}
                className="size-9 rounded-xl flex items-center justify-center"
                style={{ background: icon === ic ? `${color}20` : "var(--panel-2)", border: `1px solid ${icon === ic ? color : "var(--line)"}` }}>
                <span className="material-symbols-rounded text-[18px]" style={{ color: icon === ic ? color : "var(--ink-dim)" }}>{ic}</span>
              </button>
            ))}
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold" style={{ color: "var(--ink-mid)" }}>Colour</span>
          <div className="flex gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className="size-7 rounded-full" style={{ background: c, outline: color === c ? `2px solid ${c}` : "none", outlineOffset: 2 }} />
            ))}
          </div>
        </label>

        {error && <div className="text-[12.5px]" style={{ color: "var(--coral)" }}>{error}</div>}

        <button type="button" disabled={isPending} onClick={create}
          className="w-full py-2.5 rounded-xl text-[14px] font-bold"
          style={{ background: "var(--teal)", color: "#fff", opacity: isPending ? 0.7 : 1 }}>
          {isPending ? "Creating…" : "Create course"}
        </button>
      </div>
    </div>
  );
}
