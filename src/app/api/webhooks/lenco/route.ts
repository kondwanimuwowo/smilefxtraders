import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";

// Create a module-level Prisma instance that is guaranteed to be initialised
// after Next.js has loaded all environment variables. Using the shared
// @/lib/prisma singleton caused "Cannot read properties of undefined" errors
// in this route because the singleton was evaluated before env vars were ready.
function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

const globalForDb = globalThis as unknown as { webhookDb?: PrismaClient };
const db = globalForDb.webhookDb ?? getDb();
if (process.env.NODE_ENV !== "production") globalForDb.webhookDb = db;

// ── Webhook body shape from Lenco ────────────────────────────────────────────

interface LencoWebhookPayload {
  event: string;  // e.g. "collection.successful"
  data: {
    id:              string;
    reference:       string;
    lencoReference:  string;
    amount:          string;
    currency:        string;
    status:          string;
    type:            string;
  };
}

// Disable body parsing for raw HMAC verification
export const dynamic = "force-dynamic";

// ── POST /api/webhooks/lenco ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-lenco-signature") ?? "";
  const secret    = process.env.LENCO_WEBHOOK_SECRET ?? "";

  // Verify HMAC-SHA256 signature if secret is configured
  if (secret) {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      console.warn("[lenco webhook] invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: LencoWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only handle successful collections
  if (payload.event !== "collection.successful") {
    return NextResponse.json({ received: true });
  }

  const { reference } = payload.data;
  if (!reference) {
    return NextResponse.json({ received: true });
  }

  // Find the subscription by our reference
  const sub = await db.subscription.findFirst({
    where: { lencoReference: reference },
    include: { user: true },
  });

  if (!sub || sub.status === "ACTIVE") {
    return NextResponse.json({ received: true });
  }

  const now      = new Date();
  const renewsAt = new Date(now);
  renewsAt.setMonth(renewsAt.getMonth() + (sub.billingCycle === "annual" ? 12 : 1));

  // Activate subscription and upgrade user plan
  await db.$transaction([
    db.subscription.update({
      where: { id: sub.id },
      data:  { status: "ACTIVE", startedAt: now, renewsAt },
    }),
    db.user.update({
      where: { id: sub.userId },
      data:  { plan: sub.plan },
    }),
  ]);

  console.info(`[lenco webhook] plan activated: userId=${sub.userId} plan=${sub.plan}`);

  // Respond immediately — Resend welcome email can be added here later
  return NextResponse.json({ received: true });
}
