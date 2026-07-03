import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { addMonths } from "@/lib/date";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email/send";
import { paymentConfirmedEmail } from "@/lib/email/templates/billing";

function fmtAmount(amountCents: number, currency: string): string {
  const units = amountCents / 100;
  const n = Number.isInteger(units) ? String(units) : units.toFixed(2);
  return currency === "ZMW" ? `K${n}` : `$${n}`;
}

const LENCO_BASE = "https://api.lenco.co/access/v2";
const LENCO_KEY  = process.env.LENCO_API_KEY ?? "";

// ── GET /api/checkout/verify?ref=<lencoReference> ────────────────────────────

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref");
  if (!ref) return NextResponse.json({ error: "Missing ref" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Poll Lenco for the collection status
  const lencoRes = await fetch(`${LENCO_BASE}/collections/status/${encodeURIComponent(ref)}`, {
    headers: { "Authorization": `Bearer ${LENCO_KEY}` },
  });

  const lencoData = await lencoRes.json().catch(() => ({}));

  if (!lencoRes.ok) {
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }

  const collectionStatus: string = lencoData.data?.status ?? "pending";

  if (collectionStatus === "successful") {
    // Find the pending subscription and activate it
    const sub = await prisma.subscription.findFirst({
      where: { lencoReference: ref, userId: dbUser.id },
    });

    if (sub && sub.status === "PENDING") {
      const now      = new Date();
      const renewsAt = addMonths(now, sub.billingCycle === "annual" ? 12 : 1);

      // Idempotent activation: guarded transition so this route and the Lenco
      // webhook can race — only the caller that flips the row sends anything.
      const activated = await prisma.$transaction(async (tx) => {
        const r = await tx.subscription.updateMany({
          where: { id: sub.id, status: "PENDING" },
          data:  { status: "ACTIVE", startedAt: now, renewsAt },
        });
        if (r.count === 0) return false;
        await tx.user.update({
          where: { id: dbUser.id },
          data:  { plan: sub.plan, planExpiresAt: null },
        });
        return true;
      });

      if (activated) {
        void (async () => {
          const created = await createNotification(dbUser.id, {
            type:      "PAYMENT_CONFIRMED",
            title:     "Payment confirmed",
            body:      `Your ${sub.plan === "FUNDED" ? "Funded Track" : "Pro Trader"} plan is now active.`,
            icon:      "workspace_premium",
            tone:      "gold",
            href:      "/settings",
            dedupeKey: `payment-confirmed:${sub.id}:${renewsAt.toISOString()}`,
          });
          if (created) {
            const { subject, html } = paymentConfirmedEmail({
              name:         dbUser.name,
              plan:         sub.plan,
              amount:       fmtAmount(sub.amountCents, sub.currency),
              billingCycle: sub.billingCycle,
              reference:    sub.lencoReference ?? sub.id,
              renewsAt,
            });
            await sendEmail({ from: "hello", to: dbUser.email, subject, html });
          }
        })().catch((e) => console.error("[checkout/verify] notify failed:", e instanceof Error ? e.message : e));
      }
    }
  }

  return NextResponse.json({
    status:    collectionStatus,
    activated: collectionStatus === "successful",
  });
}
