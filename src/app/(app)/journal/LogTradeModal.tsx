"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useStore } from "@/lib/store";
import type { Trade } from "@/lib/store";
import { useAddTrade, useUpdateTrade } from "@/lib/hooks/useTrades";
import { Modal, Button, Field, MonoInput, Textarea, Select, SegRow, Stars, ImageDrop } from "@/components/ui";
import { MODELS, TAG_POOL, FIB_TAG_OPTIONS, type Framework } from "@/lib/frameworks";
import confetti from "canvas-confetti";
import { useInstrumentSymbols } from "@/lib/hooks/useInstruments";

const SESSIONS = ["London", "New York", "Asia"];

import { format } from "@/lib/date";
function nowLocal() {
  return format(new Date(), "yyyy-MM-dd'T'HH:mm");
}

interface FormState {
  framework:  Framework;
  pair:       string;
  dir:        string;
  model:      string;
  session:    string;
  openedAt:   string;
  closedAt:   string;
  entryPrice: string;
  stopLoss:   string;
  takeProfit: string;
  closePrice: string;
  rr:         string;
  riskPct:    string;
  result:     string;
  discipline: string;
  rating:     number;
  fibTags:    string[];
  mistake:    string;
  note:       string;
  chartUrl:   string;
}

function makeBlank(framework: Framework): FormState {
  return {
    framework,
    pair:       "XAUUSD",
    dir:        "long",
    model:      MODELS[framework][0],
    session:    "London",
    openedAt:   nowLocal(),
    closedAt:   "",
    entryPrice: "",
    stopLoss:   "",
    takeProfit: "",
    closePrice: "",
    rr:         "",
    riskPct:    "0.5",
    result:     "open",
    discipline: "yes",
    rating:     4,
    fibTags:    [],
    mistake:    "",
    note:       "",
    chartUrl:   "",
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  edit?: Trade | null;
  preset?: Partial<Trade> | null;
}

export function LogTradeModal({ open, onClose, edit, preset }: Props) {
  const { toast, user } = useStore();
  const { mutate: addTrade } = useAddTrade();
  const { mutate: updateTrade } = useUpdateTrade();
  const pairs = useInstrumentSymbols();
  const defaultFw = (user?.framework ?? "SMC") as Framework;
  const [f, setF] = useState<FormState>(makeBlank(defaultFw));

  useEffect(() => {
    if (!open) return;
    if (edit) {
      const fw = (edit.framework ?? "SMC") as Framework;
      setF({
        framework:  fw,
        pair:       edit.pair,
        dir:        edit.dir,
        model:      edit.model,
        session:    edit.session ?? "London",
        openedAt:   edit.openedAt ? edit.openedAt.slice(0, 16) : nowLocal(),
        closedAt:   edit.closedAt ? edit.closedAt.slice(0, 16) : "",
        entryPrice: edit.entryPrice != null ? String(edit.entryPrice) : "",
        stopLoss:   edit.stopLoss   != null ? String(edit.stopLoss)   : "",
        takeProfit: edit.takeProfit != null ? String(edit.takeProfit) : "",
        closePrice: edit.closePrice != null ? String(edit.closePrice) : "",
        rr:         String(edit.rr ?? ""),
        riskPct:    String(edit.riskPct ?? "0.5"),
        result:     edit.result,
        discipline: edit.discipline ? "yes" : "no",
        rating:     edit.rating ?? 4,
        fibTags:    (edit.tags ?? []).filter((t) => FIB_TAG_OPTIONS.includes(t as typeof FIB_TAG_OPTIONS[number])),
        mistake:    edit.mistake ?? "",
        note:       edit.note ?? "",
        chartUrl:   edit.chartUrl ?? "",
      });
    } else if (preset) {
      const fw = (preset.framework ?? defaultFw) as Framework;
      const blank = makeBlank(fw);
      setF({
        ...blank,
        framework:  fw,
        pair:       preset.pair       ?? blank.pair,
        dir:        preset.dir        ?? blank.dir,
        model:      preset.model      ?? blank.model,
        session:    preset.session    ?? blank.session,
        rr:         preset.rr         != null ? String(preset.rr)         : blank.rr,
        riskPct:    preset.riskPct    != null ? String(preset.riskPct)    : blank.riskPct,
        entryPrice: preset.entryPrice != null ? String(preset.entryPrice) : blank.entryPrice,
        stopLoss:   preset.stopLoss   != null ? String(preset.stopLoss)   : blank.stopLoss,
        takeProfit: preset.takeProfit != null ? String(preset.takeProfit) : blank.takeProfit,
        result:     preset.result     ?? blank.result,
        discipline: preset.discipline != null ? (preset.discipline ? "yes" : "no") : blank.discipline,
      });
    } else {
      setF(makeBlank(defaultFw));
    }
  }, [open, edit, preset, defaultFw]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setF((p) => ({ ...p, [k]: v }));

  function handleFrameworkChange(fw: Framework) {
    setF((p) => ({ ...p, framework: fw, model: MODELS[fw][0] }));
  }

  function save() {
    const rr      = parseFloat(f.rr) || 0;
    const riskPct = parseFloat(f.riskPct) || 0.5;
    const pnlR    = f.result === "win" ? rr : f.result === "loss" ? -1 : 0;
    const tags    = [...(TAG_POOL[f.framework][f.model] ?? []), ...f.fibTags];
    const isClosed = f.result !== "open";

    const payload = {
      date:       edit?.date ?? format(new Date(), "MMM dd"),
      openedAt:   f.openedAt ? new Date(f.openedAt).toISOString() : undefined,
      closedAt:   isClosed && f.closedAt ? new Date(f.closedAt).toISOString() : undefined,
      pair:       f.pair,
      dir:        f.dir as "long" | "short",
      model:      f.model,
      framework:  f.framework,
      session:    f.session,
      entryPrice: f.entryPrice  ? parseFloat(f.entryPrice)  : undefined,
      stopLoss:   f.stopLoss    ? parseFloat(f.stopLoss)    : undefined,
      takeProfit: f.takeProfit  ? parseFloat(f.takeProfit)  : undefined,
      closePrice: isClosed && f.closePrice ? parseFloat(f.closePrice) : undefined,
      rr,
      riskPct,
      result:     f.result as "win" | "loss" | "open",
      pnlR,
      discipline: f.discipline === "yes",
      rating:     f.rating,
      tags,
      mistake:    f.mistake || undefined,
      note:       f.note || undefined,
      chartUrl:   f.chartUrl || undefined,
    };

    if (edit) {
      if (!edit.id || edit.id.startsWith("temp_")) {
        toast("Trade still syncing. Please wait a moment and try again.", "gold", "sync");
        return;
      }
      updateTrade({ id: edit.id, patch: payload });
      toast("Trade updated", "teal", "edit");
    } else {
      // handles both blank new trade and preset-filled trade from validator
      addTrade(payload);
      toast(`${f.pair} ${f.dir} logged`, "teal", "add_task");
      if (f.result === "win" && f.discipline === "yes") {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }
    onClose();
  }

  // Auto-calculate R:R whenever entry, SL, and TP are all filled
  const calculatedRR = useMemo(() => {
    const en = parseFloat(f.entryPrice);
    const sl = parseFloat(f.stopLoss);
    const tp = parseFloat(f.takeProfit);
    if (isNaN(en) || isNaN(sl) || isNaN(tp)) return null;
    const risk   = Math.abs(en - sl);
    const reward = Math.abs(tp - en);
    if (risk < 0.000001) return null;
    return +(reward / risk).toFixed(2);
  }, [f.entryPrice, f.stopLoss, f.takeProfit]);

  const lastCalcRef = useRef<number | null>(null);
  useEffect(() => {
    if (calculatedRR !== null && calculatedRR !== lastCalcRef.current) {
      lastCalcRef.current = calculatedRR;
      set("rr", String(calculatedRR));
    }
  }, [calculatedRR]);

  const isSMC      = f.framework === "SMC";
  const modelLabel = isSMC ? "SMC Model" : "S&D Setup";
  const modalSub   = isSMC
    ? "Tag it to its SMC model. Your future self will thank you."
    : "Tag it to its S&D setup. Your future self will thank you.";
  const isEditLock = !!edit; // only lock framework when editing a saved trade, not when using a preset
  const isClosed   = f.result !== "open";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={edit ? "Edit trade" : preset ? "Log this setup" : "Log a trade"}
      sub={modalSub}
      width={680}
      footer={
        <div className="flex gap-2.5 justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="primary" icon={edit ? "check" : "add_task"} onClick={save}>
            {edit ? "Save changes" : "Log trade"}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-4">

        {/* Framework toggle — locked when editing */}
        <div className="col-span-2">
          <Field label="Trading framework">
            <SegRow
              value={f.framework}
              onChange={(v) => !isEditLock && handleFrameworkChange(v as Framework)}
              options={[
                { v: "SMC", l: "Smart Money Concepts" },
                { v: "SnD", l: "Supply & Demand" },
              ]}
            />
            {isEditLock && (
              <span className="text-[11px] mt-0.5 text-ink-dim">
                Framework cannot be changed when editing a logged trade.
              </span>
            )}
          </Field>
        </div>

        {/* Instrument + Direction */}
        <Field label="Instrument" half>
          <Select
            value={f.pair}
            onChange={(v) => set("pair", v)}
            options={pairs.length ? pairs : ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "NZDUSD", "USDCAD", "XAUUSD", "NAS100"]}
          />
        </Field>
        <Field label="Direction" half>
          <SegRow
            value={f.dir}
            onChange={(v) => set("dir", v)}
            options={[{ v: "long", l: "Long" }, { v: "short", l: "Short" }]}
          />
        </Field>

        {/* Model */}
        <Field label={modelLabel}>
          <Select
            value={f.model}
            onChange={(v) => set("model", v)}
            options={MODELS[f.framework]}
          />
        </Field>

        {/* Session + Risk */}
        <Field label="Session" half>
          <Select
            value={f.session}
            onChange={(v) => set("session", v)}
            options={SESSIONS}
          />
        </Field>
        <Field label="Risk %" half>
          <MonoInput
            value={f.riskPct}
            onChange={(e) => set("riskPct", e.target.value)}
            placeholder="0.5"
          />
        </Field>

        {/* Opened at + R:R */}
        <Field label="Opened at" half>
          <input
            type="datetime-local"
            value={f.openedAt}
            onChange={(e) => set("openedAt", e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-[13px] font-mono bg-transparent border border-line text-ink-strong outline-none"
          />
        </Field>
        <Field
          label={
            <span className="flex items-center gap-1.5">
              Planned R:R
              {calculatedRR !== null && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[rgba(8,174,170,0.1)] text-teal border border-[rgba(8,174,170,0.2)]">
                  auto
                </span>
              )}
            </span>
          }
          half
        >
          <MonoInput
            value={f.rr}
            onChange={(e) => { lastCalcRef.current = null; set("rr", e.target.value); }}
            placeholder="3.1"
          />
        </Field>

        {/* Entry price + SL */}
        <Field label="Entry price" half>
          <MonoInput
            value={f.entryPrice}
            onChange={(e) => set("entryPrice", e.target.value)}
            placeholder="1.08420"
          />
        </Field>
        <Field label="Stop loss" half>
          <MonoInput
            value={f.stopLoss}
            onChange={(e) => set("stopLoss", e.target.value)}
            placeholder="1.08150"
          />
        </Field>

        {/* TP */}
        <Field label="Take profit">
          <MonoInput
            value={f.takeProfit}
            onChange={(e) => set("takeProfit", e.target.value)}
            placeholder="1.09080"
          />
        </Field>

        {/* Outcome */}
        <Field label="Outcome" half>
          <SegRow
            value={f.result}
            onChange={(v) => set("result", v)}
            options={[{ v: "win", l: "Win" }, { v: "loss", l: "Loss" }, { v: "open", l: "Open" }]}
          />
        </Field>

        {/* Close price + Closed at — only when trade is closed */}
        {isClosed && (
          <>
            <Field label="Close price" half>
              <MonoInput
                value={f.closePrice}
                onChange={(e) => set("closePrice", e.target.value)}
                placeholder="1.09080"
              />
            </Field>
            <Field label="Closed at" half>
              <input
                type="datetime-local"
                value={f.closedAt}
                onChange={(e) => set("closedAt", e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-[13px] font-mono bg-transparent border border-line text-ink-strong outline-none"
              />
            </Field>
          </>
        )}

        {/* Discipline */}
        <Field label="Followed your rules?">
          <SegRow
            value={f.discipline}
            onChange={(v) => set("discipline", v)}
            options={[{ v: "yes", l: "Yes, clean execution" }, { v: "no", l: "No, rule broken" }]}
          />
        </Field>

        {/* Execution quality */}
        <Field label="Execution quality">
          <div className="flex items-center gap-3 py-1">
            <Stars value={f.rating} onChange={(v) => set("rating", v)} size={22} />
            <span className="text-[12px] text-ink-dim">
              {["", "Poor", "Below avg", "Average", "Good", "Textbook"][f.rating]}
            </span>
          </div>
        </Field>

        {/* Fibonacci confluence tags */}
        <div className="col-span-2">
          <Field label="Fibonacci confluence (optional)">
            <div className="flex flex-wrap gap-2 pt-0.5">
              {FIB_TAG_OPTIONS.map((tag) => {
                const active = f.fibTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      set(
                        "fibTags",
                        active
                          ? f.fibTags.filter((t) => t !== tag)
                          : [...f.fibTags, tag],
                      )
                    }
                    className={`rounded-full px-3 py-1 text-[12px] font-semibold transition-all cursor-pointer border ${
                      active
                        ? "bg-[rgba(248,185,61,0.15)] border-gold text-gold"
                        : "bg-transparent border-line text-ink-dim"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            {f.fibTags.length > 0 && (
              <span className="text-[11px] mt-1 block text-ink-dim">
                Fib level recorded as confluence, shown on the trade detail page.
              </span>
            )}
          </Field>
        </div>

        {/* Mistake */}
        {f.discipline === "no" && (
          <Field label="What rule did you break?">
            <MonoInput
              value={f.mistake}
              onChange={(e) => set("mistake", e.target.value)}
              placeholder="Entered before confirmation, chased price…"
            />
          </Field>
        )}

        {/* Notes */}
        <Field label="Notes">
          <Textarea
            value={f.note}
            onChange={(e) => set("note", e.target.value)}
            placeholder="What was the idea? Did you follow your rules? Any confluences?"
            rows={3}
          />
        </Field>

        {/* Chart screenshot */}
        <Field label="Chart screenshot">
          <ImageDrop
            value={f.chartUrl}
            onChange={(v) => set("chartUrl", v)}
          />
        </Field>

      </div>
    </Modal>
  );
}
