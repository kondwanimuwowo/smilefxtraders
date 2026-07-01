import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

// Lenco sends a webhook with an X-Lenco-Signature header (HMAC-SHA256 of the raw body)
async function verifySignature(request: Request): Promise<{ valid: boolean; body: string }> {
  const secret = process.env.LENCO_WEBHOOK_SECRET ?? "";
  const signature = request.headers.get("x-lenco-signature") ?? "";
  const body = await request.text();

  if (!secret || !signature) return { valid: false, body };

  const expected = createHmac("sha256", secret).update(body).digest("hex");
  try {
    const valid = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    return { valid, body };
  } catch {
    return { valid: false, body };
  }
}

export async function POST(request: Request) {
  const { valid, body } = await verifySignature(request);

  // In dev without a real secret, allow unsigned webhooks (log a warning)
  if (!valid && process.env.LENCO_WEBHOOK_SECRET) {
    console.warn("[webhook] Invalid Lenco signature — rejected");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: { status?: string; reference?: string; data?: { reference?: string; status?: string } };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Normalise: Lenco may nest under `data`
  const status    = payload.status ?? payload.data?.status ?? "";
  const reference = payload.reference ?? payload.data?.reference ?? "";

  if (!reference) {
    return NextResponse.json({ ok: true }); // ignore events we can't match
  }

  const subscription = await prisma.subscription.findFirst({
    where: { lencoReference: reference },
  });

  if (!subscription) {
    return NextResponse.json({ ok: true }); // unknown reference — ignore
  }

  if (status === "successful") {
    // Idempotent: only activate if still pending
    if (subscription.status !== "ACTIVE") {
      const now = new Date();
      const renewsAt = new Date(now);
      if (subscription.billingCycle === "annual") {
        renewsAt.setFullYear(renewsAt.getFullYear() + 1);
      } else {
        renewsAt.setMonth(renewsAt.getMonth() + 1);
      }

      await prisma.$transaction([
        prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "ACTIVE", startedAt: now, renewsAt },
        }),
        prisma.user.update({
          where: { id: subscription.userId },
          data: { plan: subscription.plan, planExpiresAt: null },
        }),
      ]);
    }
  } else if (status === "failed" || status === "declined" || status === "expired") {
    // Payment failed — mark the subscription expired; don't touch the user's plan
    if (subscription.status === "PENDING") {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: "EXPIRED" },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
