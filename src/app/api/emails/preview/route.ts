/**
 * POST /api/emails/preview?to=you@example.com
 *
 * Sends every email template with realistic sample data to the given address
 * so the real inbox rendering can be reviewed. Protected by CRON_SECRET.
 * Optionally filter to one template: ?only=welcome
 *
 * curl -X POST "https://app.smilefxtraders.com/api/emails/preview?to=you@example.com" \
 *   -H "Authorization: Bearer <CRON_SECRET>"
 *
 * Note: the signup-verification and password-reset emails are sent by
 * Supabase (via its SMTP settings), not by this codebase — preview those by
 * triggering a real signup / reset.
 */

import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/send";
import type { SenderKey } from "@/lib/email/resend";
import { welcomeEmail } from "@/lib/email/templates/welcome";
import {
  paymentConfirmedEmail,
  paymentFailedEmail,
  cancellationEmail,
  renewalReminderEmail,
  planExpiredEmail,
} from "@/lib/email/templates/billing";
import { weeklyReportEmail } from "@/lib/email/templates/weekly-report";
import { instructorAlertEmail } from "@/lib/email/templates/instructor-alert";
import { communityCommentEmail } from "@/lib/email/templates/community-comment";

export async function POST(req: NextRequest) {
  const auth   = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const to   = req.nextUrl.searchParams.get("to");
  const only = req.nextUrl.searchParams.get("only");
  if (!to) return NextResponse.json({ error: "Missing ?to=email" }, { status: 400 });

  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.smilefxtraders.com";
  const inWeek   = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

  const previews: Record<string, { from: SenderKey; subject: string; html: string }> = {
    "welcome": { from: "kondwani", ...welcomeEmail({ name: "Mwila Kunda" }) },

    "payment-confirmed": {
      from: "hello",
      ...paymentConfirmedEmail({
        name:         "Mwila Kunda",
        plan:         "PRO",
        amount:       "K750",
        billingCycle: "monthly",
        reference:    "SMFX-PRO-9F2A61C4",
        renewsAt:     inWeek(30),
      }),
    },

    "payment-failed": { from: "hello", ...paymentFailedEmail({ name: "Mwila Kunda", plan: "PRO" }) },

    "cancellation": {
      from: "hello",
      ...cancellationEmail({ name: "Mwila Kunda", plan: "PRO", accessUntil: inWeek(18) }),
    },

    "renewal-reminder": {
      from: "hello",
      ...renewalReminderEmail({ name: "Mwila Kunda", plan: "FUNDED", renewsAt: inWeek(3) }),
    },

    "plan-expired": { from: "hello", ...planExpiredEmail({ name: "Mwila Kunda", plan: "PRO" }) },

    "weekly-report": {
      from: "hello",
      ...weeklyReportEmail({
        name:         "Mwila Kunda",
        trades:       12,
        wins:         7,
        losses:       4,
        winRate:      58,
        netR:         "5.3R",
        streak:       4,
        bestModel:    "Liquidity Sweep → FVG",
        dashboardUrl: `${appUrl}/dashboard`,
      }),
    },

    "instructor-alert": {
      from: "hello",
      ...instructorAlertEmail({
        pair:       "EURUSD",
        direction:  "LONG",
        title:      "London sweep into 4H FVG",
        model:      "Liquidity Sweep → FVG",
        entryPrice: 1.0842,
        stopLoss:   1.0818,
        tp1:        1.0915,
        rr:         "3.0R",
      }),
    },

    "community-comment": {
      from: "hello",
      ...communityCommentEmail({
        name:          "Mwila Kunda",
        commenterName: "Chanda Bwalya",
        commentText:   "Clean entry! Did you wait for the 5m CHoCH before entering or take it straight off the FVG tap?",
        postExcerpt:   "Caught the NY session sweep on GBPUSD today — patience finally paying off. +2.4R",
      }),
    },
  };

  const results: Record<string, string> = {};
  for (const [key, p] of Object.entries(previews)) {
    if (only && key !== only) continue;
    const ok = await sendEmail({ from: p.from, to, subject: p.subject, html: p.html });
    results[key] = ok ? "sent" : "failed";
  }

  return NextResponse.json({ to, results });
}
