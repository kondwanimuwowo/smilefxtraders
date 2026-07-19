"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Panel, Button, Field, Select, Icon } from "@/components/ui";
import { useInstrumentSymbols } from "@/lib/hooks/useInstruments";
import { usePostAlert } from "../Alerts";

const SESSIONS = ["London", "New York", "Asia"];
const MODELS   = [
  "Liquidity Sweep → FVG", "OB + BOS", "Liquidity → CHoCH",
  "SMT + OB", "OB + FVG", "Turtle Soup", "BOS + retrace",
];

export default function PostAlertPage() {
  const router = useRouter();
  const { user } = useStore();
  const { mutate: postAlert, isPending } = usePostAlert();
  const pairs = useInstrumentSymbols();
  const [form, setForm] = useState({
    pair: "XAUUSD", dir: "long" as "long" | "short",
    model: MODELS[0], session: "London",
    entry: "", sl: "", tp1: "", tp2: "",
    rr: "", tagInput: "", tags: [] as string[], note: "",
  });

  const set = (k: string, v: string | string[]) => setForm((f) => ({ ...f, [k]: v }));

  function addTag() {
    const t = form.tagInput.trim();
    if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]);
    set("tagInput", "");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    postAlert({
      pair: form.pair, dir: form.dir, model: form.model,
      session: form.session, rr: form.rr,
      entry: form.entry, sl: form.sl, tp1: form.tp1,
      tp2: form.tp2 || undefined, tags: form.tags, note: form.note,
    }, { onSuccess: () => router.push("/alerts") });
  }

  if (user && user.role !== "instructor") {
    return (
      <div className="view flex flex-col items-center justify-center gap-4 py-24">
        <Icon name="lock" size={48} className="text-ink-dim" />
        <p className="text-[14px] text-ink-dim">Only instructors can post alerts.</p>
        <Button type="button" variant="ghost" icon="arrow_back" onClick={() => router.push("/alerts")}>
          Back to alerts
        </Button>
      </div>
    );
  }

  return (
    <div className="view">
      <div className="max-w-lg">
        <div className="mb-5">
          <h1 className="font-display font-medium text-2xl tracking-[-0.02em] text-ink-strong">
            Post Alert
          </h1>
          <p className="text-[13px] mt-0.5 text-ink-dim">
            Goes live to students immediately (Pro), or after a 4-hour delay (Free).
          </p>
        </div>

        <Panel>
          <form onSubmit={submit} className="space-y-4">
            {/* Pair + Direction */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Pair">
                <Select value={form.pair} onChange={(v) => set("pair", v)} options={pairs.length ? pairs : ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "NZDUSD", "USDCAD", "XAUUSD", "NAS100"]} />
              </Field>
              <Field label="Direction">
                <div className="flex rounded-xl overflow-hidden shadow-sm">
                  {(["long", "short"] as const).map((d) => (
                    <button
                      key={d} type="button" onClick={() => set("dir", d)}
                      className={`flex-1 py-2 text-[12.5px] font-semibold capitalize transition-all ${
                        form.dir === d
                          ? d === "long" ? "bg-teal text-white" : "bg-coral text-white"
                          : "bg-panel-2 text-ink-mid"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {/* Model + Session */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Model">
                <Select value={form.model} onChange={(v) => set("model", v)} options={MODELS} />
              </Field>
              <Field label="Session">
                <Select value={form.session} onChange={(v) => set("session", v)} options={SESSIONS} />
              </Field>
            </div>

            {/* Entry / SL / TP1 / TP2 / RR */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Entry", key: "entry" }, { label: "Stop Loss", key: "sl" },
                { label: "TP1",   key: "tp1" },   { label: "TP2 (opt)", key: "tp2" },
                { label: "R:R",   key: "rr" },
              ].map(({ label, key }) => (
                <Field key={key} label={label}>
                  <input
                    type="text" value={(form as unknown as Record<string, string>)[key]}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder={label}
                    className="w-full px-3 py-2 rounded-xl text-[13px] bg-panel-2 shadow-[inset_0_1px_3px_rgba(0,0,0,0.12)] focus:shadow-[inset_0_1px_3px_rgba(0,0,0,0.12),0_0_0_2px_var(--teal)] transition-shadow text-ink-strong outline-none"
                  />
                </Field>
              ))}
            </div>

            {/* Tags */}
            <Field label="Tags">
              <div className="flex gap-2">
                <input
                  type="text" value={form.tagInput} onChange={(e) => set("tagInput", e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="Add tag, press Enter"
                  className="flex-1 px-3 py-2 rounded-xl text-[13px] bg-panel-2 shadow-[inset_0_1px_3px_rgba(0,0,0,0.12)] focus:shadow-[inset_0_1px_3px_rgba(0,0,0,0.12),0_0_0_2px_var(--teal)] transition-shadow text-ink-strong outline-none"
                />
                <button type="button" onClick={addTag} className="px-3 rounded-xl bg-panel-2 shadow-sm text-ink-mid">
                  <Icon name="add" size={16} />
                </button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map((t) => (
                    <button key={t} type="button" onClick={() => set("tags", form.tags.filter((x) => x !== t))}
                      className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[rgba(8,174,170,0.1)] text-teal shadow-[0_0_0_2px_var(--teal)]"
                    >
                      {t} <Icon name="close" size={10} />
                    </button>
                  ))}
                </div>
              )}
            </Field>

            {/* Note */}
            <Field label="Analysis Note">
              <textarea
                value={form.note} onChange={(e) => set("note", e.target.value)}
                rows={4} placeholder="HTF bias, entry rationale, key levels..."
                className="w-full px-3 py-2 rounded-xl text-[13px] resize-none bg-panel-2 shadow-[inset_0_1px_3px_rgba(0,0,0,0.12)] focus:shadow-[inset_0_1px_3px_rgba(0,0,0,0.12),0_0_0_2px_var(--teal)] transition-shadow text-ink-strong outline-none"
              />
            </Field>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => router.back()} className="flex-1">Cancel</Button>
              <Button type="submit" variant="primary" icon="notifications_active" className="flex-1" disabled={isPending}>
                {isPending ? "Posting…" : "Post Alert"}
              </Button>
            </div>
          </form>
        </Panel>
      </div>
    </div>
  );
}
