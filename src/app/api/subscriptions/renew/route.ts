/**
 * POST /api/subscriptions/renew
 *
 * Daily subscription-lifecycle cron (02:00 UTC). Three passes:
 *   1. Expiry   — expire overdue ACTIVE subs, downgrade user to FREE, notify.
 *   2. Reminder — notify users whose sub renews within the next 3 days (once
 *                 per renewal cycle — the notification dedupeKey is the sent-flag).
 *   3. Grace    — downgrade users whose cancellation grace period has ended.
 *
 * Lenco initiates re-billing — when the next payment clears, the webhook
 * reactivates the subscription and upgrades the plan automatically.
 *
 * Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email/send";
import { planExpiredEmail, renewalReminderEmail } from "@/lib/email/templates/billing";
import { handleApiError } from "@/lib/api-error";

const REMINDER_DAYS = 3;

/**
 * Runs one subscriber's lifecycle step, swallowing its failure.
 *
 * Each pass below loops over users and awaits a DB write plus an email send
 * per user. Before this, a single failure — one bounced address, one
 * transient Resend 5xx — threw out of the loop and abandoned every remaining
 * user in that run *and* the passes after it, silently, until the next day's
 * cron. Isolating per user means one bad record can't strand the batch.
 */
async function isolate(label: string, fn: () => Promise<void>): Promise<boolean> {
  try {
    await fn();
    return true;
  } catch (e) {
    console.error(`[subscriptions/renew] ${label} failed:`, e instanceof Error ? e.message : e);
    return false;
  }
}

export async function POST(req: NextRequest) {
  const auth   = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // ── Pass 1: expire overdue ACTIVE subscriptions ─────────────────────────────

    const overdue = await prisma.subscription.findMany({
      where: { status: "ACTIVE", renewsAt: { lt: now } },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    const expired: { userId: string; plan: string }[] = [];

    for (const sub of overdue) {
      await isolate(`expire ${sub.id}`, async () => {
        await prisma.$transaction([
          prisma.subscription.update({
            where: { id: sub.id },
            data:  { status: "EXPIRED" },
          }),
          prisma.user.update({
            where: { id: sub.userId },
            data:  { plan: "FREE", planExpiresAt: null },
          }),
        ]);

        expired.push({ userId: sub.userId, plan: sub.plan });
        console.info(`[subscriptions/renew] expired: userId=${sub.userId} was=${sub.plan}`);

        const created = await createNotification(sub.userId, {
          type:      "PLAN_EXPIRED",
          title:     "Your plan has expired",
          body:      "Your account is now on the free Starter plan. Renew to restore full access.",
          icon:      "hourglass_disabled",
          tone:      "coral",
          href:      "/pricing",
          dedupeKey: `plan-expired:${sub.id}`,
        });
        if (created) {
          const { subject, html } = planExpiredEmail({ name: sub.user.name, plan: sub.plan });
          await sendEmail({ from: "hello", to: sub.user.email, subject, html });
        }
      });
    }

    // ── Pass 2: renewal reminders (T-3 days, once per cycle) ────────────────────

    const reminderCutoff = new Date(now.getTime() + REMINDER_DAYS * 24 * 60 * 60 * 1000);
    const upcoming = await prisma.subscription.findMany({
      where: { status: "ACTIVE", renewsAt: { gte: now, lte: reminderCutoff } },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    let reminded = 0;

    for (const sub of upcoming) {
      const renewsAt = sub.renewsAt;
      if (!renewsAt) continue;
      await isolate(`remind ${sub.id}`, async () => {
        // The dedupeKey doubles as the sent-flag: it self-resets each cycle
        // because renewsAt changes after every successful renewal.
        const created = await createNotification(sub.userId, {
          type:      "PLAN_EXPIRING",
          title:     "Your plan renews soon",
          body:      `Your ${sub.plan === "PRO" ? "Pro" : "Edge"} plan renews on ${renewsAt.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}.`,
          icon:      "schedule",
          tone:      "gold",
          href:      "/settings",
          dedupeKey: `renewal-reminder:${sub.id}:${renewsAt.toISOString()}`,
        });
        if (created) {
          reminded++;
          const { subject, html } = renewalReminderEmail({
            name:     sub.user.name,
            plan:     sub.plan,
            renewsAt,
          });
          await sendEmail({ from: "hello", to: sub.user.email, subject, html });
        }
      });
    }

    // ── Pass 3: cancelled-grace downgrades ──────────────────────────────────────
    // Users who cancelled keep their plan until planExpiresAt. The app layout
    // lazy-downgrades on next load as a silent fallback; this pass catches
    // everyone else and sends the expiry notice.

    const graceEnded = await prisma.user.findMany({
      where: { planExpiresAt: { lt: now }, plan: { not: "FREE" } },
      select: { id: true, name: true, email: true, plan: true, planExpiresAt: true },
    });

    let graceDowngraded = 0;

    for (const u of graceEnded) {
      const wasPlan = u.plan;
      await isolate(`grace ${u.id}`, async () => {
        await prisma.user.update({
          where: { id: u.id },
          data:  { plan: "FREE", planExpiresAt: null },
        });
        graceDowngraded++;
        console.info(`[subscriptions/renew] grace ended: userId=${u.id} was=${wasPlan}`);

        const created = await createNotification(u.id, {
          type:      "PLAN_EXPIRED",
          title:     "Your plan has ended",
          body:      "Your cancellation grace period is over. You're on the free Starter plan now.",
          icon:      "hourglass_disabled",
          tone:      "coral",
          href:      "/pricing",
          dedupeKey: `plan-expired-grace:${u.id}:${u.planExpiresAt?.toISOString()}`,
        });
        if (created) {
          const { subject, html } = planExpiredEmail({ name: u.name, plan: wasPlan });
          await sendEmail({ from: "hello", to: u.email, subject, html });
        }
      });
    }

    return NextResponse.json({
      expired:         expired.length,
      reminded,
      graceDowngraded,
      users:           expired,
    });
  } catch (err) {
    return handleApiError("subscriptions/renew", err);
  }
}
