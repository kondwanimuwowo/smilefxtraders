// Event-specific notification fan-outs. Called fire-and-forget from API
// routes — must never throw into the request path.

import type { Alert } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { prefEnabled } from "@/lib/notif-prefs";
import { createNotifications } from "@/lib/notifications";
import { sendBatch, type EmailItem } from "@/lib/email/send";
import { instructorAlertEmail } from "@/lib/email/templates/instructor-alert";

const FREE_ALERT_DELAY_MS = 4 * 60 * 60 * 1000; // mirrors the GET /api/alerts gate

export async function fanOutInstructorAlert(alert: Alert): Promise<void> {
  const users = await prisma.user.findMany({
    where:  alert.authorId ? { id: { not: alert.authorId } } : undefined,
    select: { id: true, email: true, plan: true, role: true, notifPrefs: true },
  });

  const notif = {
    type:      "INSTRUCTOR_ALERT" as const,
    title:     `New alert: ${alert.pair} ${alert.direction}`,
    body:      `${alert.model} · Entry ${alert.entryPrice} · ${alert.rr}`,
    icon:      "podcasts",
    tone:      "teal" as const,
    href:      "/alerts",
    dedupeKey: `alert:${alert.id}`,
  };

  const inApp = users.filter((u) => prefEnabled(u.notifPrefs, "alertNotif"));
  const isPaid = (u: (typeof users)[number]) => u.plan !== "FREE" || u.role === "INSTRUCTOR";

  // Paid members see the alert immediately; FREE members after the same
  // 4-hour delay the alerts feed applies (visibleAt gates the bell).
  const paidIds = inApp.filter(isPaid).map((u) => u.id);
  const freeIds = inApp.filter((u) => !isPaid(u)).map((u) => u.id);

  const [paidCount, freeCount] = await Promise.all([
    createNotifications(paidIds, notif),
    createNotifications(freeIds, {
      ...notif,
      visibleAt: new Date(alert.postedAt.getTime() + FREE_ALERT_DELAY_MS),
    }),
  ]);

  // Email: paid members only — emailing FREE users immediately would leak
  // content their plan gates for 4 hours.
  const { subject, html } = instructorAlertEmail({
    pair:       alert.pair,
    direction:  alert.direction,
    title:      alert.title,
    model:      alert.model,
    entryPrice: alert.entryPrice,
    stopLoss:   alert.stopLoss,
    tp1:        alert.tp1,
    rr:         alert.rr,
  });

  const emailItems: EmailItem[] = users
    .filter((u) => isPaid(u) && prefEnabled(u.notifPrefs, "emailAlerts"))
    .map((u) => ({ from: "hello" as const, to: u.email, subject, html }));

  const emailResult = emailItems.length > 0 ? await sendBatch(emailItems) : { sent: 0, failed: 0 };

  console.info(
    `[alerts] fan-out ${alert.id}: in-app paid=${paidCount} free-delayed=${freeCount}, emails sent=${emailResult.sent} failed=${emailResult.failed}`
  );
}

// MacroEdge Phase 4 — fired when a pair's BiasLabel changes between two
// recompute runs. "Score changed" is too noisy a trigger on its own (the
// score is a continuous number that moves on almost every sync); the label
// crossing a threshold is the meaningful event a trader would want paged for.
// dedupeKey is scoped to the ISO week so the same flip doesn't re-notify on
// every subsequent recompute run while it holds.
export async function fanOutMacroBiasFlip(params: {
  pair: string;
  oldLabel: string | null;
  newLabel: string;
  differential: number;
}): Promise<void> {
  const { pair, oldLabel, newLabel, differential } = params;
  if (oldLabel === newLabel) return;

  const now = new Date();
  const weekOf = `${now.getUTCFullYear()}-W${String(Math.ceil(now.getUTCDate() / 7)).padStart(2, "0")}-${now.getUTCMonth()}`;

  const users = await prisma.user.findMany({
    where:  { plan: { not: "FREE" } },
    select: { id: true, notifPrefs: true },
  });
  const targetIds = users.filter((u) => prefEnabled(u.notifPrefs, "macroNotif")).map((u) => u.id);
  if (targetIds.length === 0) return;

  const count = await createNotifications(targetIds, {
    type:      "MACRO_BIAS_FLIP",
    title:     `MacroEdge: ${pair} bias flipped to ${newLabel.replace("_", " ")}`,
    body:      `Fundamental differential now ${differential > 0 ? "+" : ""}${differential.toFixed(1)}`,
    icon:      "analytics",
    tone:      newLabel.includes("BUY") ? "teal" : newLabel.includes("SELL") ? "coral" : "gold",
    href:      `/pair/${pair.toLowerCase()}`,
    dedupeKey: `macro:${pair}:${newLabel}:${weekOf}`,
  });

  console.info(`[macro] bias flip ${pair} ${oldLabel ?? "—"} → ${newLabel}: notified ${count}`);
}

// COT — fired after a sync lands a new weekly report whose signal label
// differs from the previous week's, or whose 3-year index has crossed into
// an extreme zone (≥80 / ≤20). dedupeKey is scoped to pair + report date, so
// each pair notifies at most once per CFTC release no matter how many sync
// or manual-refresh runs re-process the same report. Paid plans only — COT
// itself is Pro/Funded-gated.
export async function fanOutCotSignal(params: {
  pair:      string;
  title:     string;
  body:      string;
  bullish:   boolean | null; // null = neutral tone
  reportDate: string;        // ISO yyyy-mm-dd of the report being announced
}): Promise<void> {
  const { pair, title, body, bullish, reportDate } = params;

  const users = await prisma.user.findMany({
    where:  { plan: { not: "FREE" } },
    select: { id: true, notifPrefs: true },
  });
  const targetIds = users.filter((u) => prefEnabled(u.notifPrefs, "cotNotif")).map((u) => u.id);
  if (targetIds.length === 0) return;

  const count = await createNotifications(targetIds, {
    type:      "COT_SIGNAL",
    title,
    body,
    icon:      "bar_chart",
    tone:      bullish == null ? "gold" : bullish ? "teal" : "coral",
    href:      `/cot/${pair}`,
    dedupeKey: `cot:${pair}:${reportDate}`,
  });

  console.info(`[cot] signal event ${pair} (${reportDate}): notified ${count}`);
}
