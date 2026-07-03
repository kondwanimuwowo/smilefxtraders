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
