"use client";

import { useEffect, useState } from "react";
import { getUTCHours, getUTCMinutes, isForexClosed } from "@/lib/date";
import { cn } from "@/lib/cn";
import { fmtCityTime, fmtCityDay } from "@/lib/date";

// ── Sessions in GMT+2 (SAST / Zambia — always UTC+2, no DST) ─────────────────
const SESSIONS = [
  {
    name: "London",    open: 9,  close: 18,
    openL: "09:00", closeL: "18:00",
    textCls: "text-teal-bright", barBgCls: "bg-teal-bright", glowShadowCls: "shadow-[0_0_10px_rgba(48,232,223,0.28)]",
  },
  {
    name: "New York",  open: 14, close: 23,
    openL: "14:00", closeL: "23:00",
    textCls: "text-coral-bright", barBgCls: "bg-coral-bright", glowShadowCls: "shadow-[0_0_10px_rgba(255,89,66,0.28)]",
  },
  {
    name: "Frankfurt", open: 8,  close: 17,
    openL: "08:00", closeL: "17:00",
    textCls: "text-teal", barBgCls: "bg-teal", glowShadowCls: "shadow-[0_0_10px_rgba(8,174,170,0.24)]",
  },
  {
    name: "Tokyo",     open: 2,  close: 11,
    openL: "02:00", closeL: "11:00",
    textCls: "text-gold", barBgCls: "bg-gold", glowShadowCls: "shadow-[0_0_10px_rgba(248,185,61,0.26)]",
  },
  {
    name: "Sydney",    open: 23, close: 8,
    openL: "23:00", closeL: "08:00",
    textCls: "text-ink-mid", barBgCls: "bg-ink-mid", glowShadowCls: "shadow-[0_0_10px_rgba(160,160,160,0.2)]",
  },
] as const;

// ── City clocks ───────────────────────────────────────────────────────────────
const CITIES = [
  { label: "New York",  tz: "America/New_York"  },
  { label: "London",    tz: "Europe/London"      },
  { label: "Frankfurt", tz: "Europe/Berlin"      },
  { label: "Tokyo",     tz: "Asia/Tokyo"         },
  { label: "Sydney",    tz: "Australia/Sydney"   },
] as const;

// ── Axis config ───────────────────────────────────────────────────────────────
const AXIS_START = 23;
const AXIS_TICKS = [23, 2, 5, 8, 11, 14, 17, 20] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function offsetFrom23(h: number): number {
  return (h - AXIS_START + 24) % 24;
}

function leftPct(offset: number): number {
  return (1 - offset / 24) * 100;
}

function nowGMT2(): number {
  const d = new Date();
  const h = (getUTCHours(d) + 2) % 24;
  return h + getUTCMinutes(d) / 60;
}

function isActive(open: number, close: number, h: number): boolean {
  if (open < close) return h >= open && h < close;
  return h >= open || h < close;
}

function cityTime(tz: string): string { return fmtCityTime(new Date(), tz); }
function cityDay(tz: string):  string { return fmtCityDay(new Date(), tz); }

// ── Component ─────────────────────────────────────────────────────────────────

export function SessionTimeline() {
  const [gmt2, setGmt2]     = useState<number | null>(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    setGmt2(nowGMT2());
    setClosed(isForexClosed());
    const t = setInterval(() => {
      setGmt2(nowGMT2());
      setClosed(isForexClosed());
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  const timeLabel = gmt2 !== null
    ? `${String(Math.floor(gmt2) % 24).padStart(2, "0")}:${String(Math.round((gmt2 % 1) * 60)).padStart(2, "0")}`
    : null;

  const isKillzone = !closed && gmt2 !== null && gmt2 >= 14 && gmt2 < 18;
  const nowLeft    = gmt2 !== null ? leftPct(offsetFrom23(gmt2)) : null;

  return (
    <div className="relative rounded-2xl px-4 sm:px-5 py-4 overflow-hidden bg-panel border border-line">
      {/* World map background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/world-map.png"
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none opacity-[0.06] [mix-blend-mode:luminosity]"
      />

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span
            className="material-symbols-rounded text-[15px] text-ink-dim"
            style={{ fontFamily: "Material Symbols Rounded Fill" }}
          >
            schedule
          </span>
          <span className="text-[13px] font-semibold font-display text-ink-strong">
            Session Timeline
          </span>
          {isKillzone && (
            <span className="text-[9.5px] font-bold uppercase tracking-[0.08em] px-2 py-0.5 rounded-full bg-[rgba(48,232,223,0.08)] text-teal-bright border border-[rgba(48,232,223,0.22)]">
              London · NY Overlap
            </span>
          )}
          {closed && (
            <span className="text-[9.5px] font-bold uppercase tracking-[0.08em] px-2 py-0.5 rounded-full bg-panel-2 text-ink-dim border border-line">
              Weekend · Closed
            </span>
          )}
        </div>

        {timeLabel && (
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold tabular-nums text-ink-strong">
              {timeLabel}
            </span>
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded tracking-[0.1em] bg-panel-2 text-ink-dim border border-line">
              GMT+2
            </span>
          </div>
        )}
      </div>

      {/* ── Session rows ── */}
      <div className="flex flex-col gap-3">
        {SESSIONS.map((s) => {
          const active = !closed && gmt2 !== null && isActive(s.open, s.close, gmt2);

          const oOff     = offsetFrom23(s.open);
          const closeRaw = offsetFrom23(s.close);
          const cOff     = closeRaw > oOff ? closeRaw : closeRaw + 24;
          const barLeft  = leftPct(cOff);
          const barWidth = (cOff - oOff) / 24 * 100;

          return (
            <div key={s.name} className="flex items-center gap-2 sm:gap-3.5">

              {/* Label — no flag */}
              <div className="shrink-0 w-[68px] sm:w-[80px]">
                <span className={cn("text-[10.5px] font-semibold transition-colors [transition-timing-function:ease] duration-[400ms]", active ? s.textCls : "text-ink-dim")}>
                  {s.name}
                </span>
              </div>

              {/* Bar track — now-line lives inside here */}
              <div className="relative flex-1 rounded-full h-2 bg-track">
                {/* Session bar */}
                <div
                  className={cn(
                    "absolute top-0 bottom-0 rounded-full transition-[opacity,box-shadow] [transition-timing-function:ease] duration-500",
                    s.barBgCls,
                    active ? cn("opacity-[0.88]", s.glowShadowCls) : "opacity-[0.14] shadow-none"
                  )}
                  style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
                />
                {/* Solid now-line */}
                {nowLeft !== null && (
                  <div
                    className="absolute pointer-events-none w-0.5 rounded-full bg-teal-bright -translate-x-1/2 -top-1 -bottom-1"
                    style={{ left: `${nowLeft}%` }}
                  />
                )}
              </div>

              {/* Status — hidden on mobile */}
              <div className="hidden sm:block shrink-0 text-right w-[112px]">
                {gmt2 !== null && (
                  active ? (
                    <span className="flex items-center justify-end gap-1.5">
                      <span className={cn("font-bold uppercase text-[9.5px] tracking-[0.1em]", s.textCls)}>
                        Open
                      </span>
                      <span className="text-[10px] text-ink-dim">
                        · closes {s.closeL}
                      </span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-ink-dim">
                      {s.openL} – {s.closeL}
                    </span>
                  )
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* ── Time axis ── */}
      <div className="flex items-start gap-2 sm:gap-3.5 mt-3">
        {/* Spacer matching label width */}
        <div className="shrink-0 w-[68px] sm:w-[80px]" />

        <div className="relative flex-1 h-[18px]">
          <div className="absolute top-0 inset-x-0 h-px bg-line opacity-35" />
          {AXIS_TICKS.map((h) => {
            const off  = offsetFrom23(h);
            const left = leftPct(off);
            if (left > 97 || left < 3) return null;
            return (
              <span
                key={h}
                className="absolute tabular-nums -translate-x-1/2 top-1 text-[9px] text-ink-dim opacity-50"
                style={{ left: `${left}%` }}
              >
                {String(h).padStart(2, "0")}
              </span>
            );
          })}
          <span className="absolute tabular-nums right-0 top-1 text-[9px] text-ink-dim opacity-50">
            23
          </span>
          {nowLeft !== null && timeLabel && (
            <span
              className="absolute tabular-nums -translate-x-1/2 top-1 text-[9px] text-teal-bright opacity-90 font-bold"
              style={{ left: `${nowLeft}%` }}
            >
              {timeLabel}
            </span>
          )}
        </div>

        {/* Spacer matching status width — hidden on mobile */}
        <div className="hidden sm:block shrink-0 w-[112px]" />
      </div>

      {/* ── City clocks ── */}
      {gmt2 !== null && (
        <div className="mt-4 pt-4 grid grid-cols-5 gap-2 border-t border-line">
          {CITIES.map((c) => {
            const t       = cityTime(c.tz);
            const day     = cityDay(c.tz);
            const session = SESSIONS.find((s) => s.name === c.label);
            const active  = !closed && session ? isActive(session.open, session.close, gmt2) : false;
            return (
              <div key={c.label} className="flex flex-col items-center gap-0.5">
                <span className={cn(
                  "text-[10.5px] sm:text-[11.5px] font-semibold tabular-nums transition-colors [transition-timing-function:ease] duration-[400ms]",
                  active && session ? session.textCls : "text-ink-strong"
                )}>
                  {t}
                </span>
                <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.06em] text-center text-ink-dim">
                  {c.label}
                </span>
                <span className="text-[7.5px] sm:text-[8.5px] font-bold uppercase tracking-[0.08em] text-teal">
                  {day}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
