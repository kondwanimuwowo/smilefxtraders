import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const LENCO_BASE = "https://api.lenco.co/access/v2";
const LENCO_KEY  = process.env.LENCO_API_KEY ?? "";

// ── Plan pricing (amount in the smallest currency unit) ─────────────────────

const PLAN_PRICES: Record<string, Record<string, { zmw: number; usd: number }>> = {
  pro: {
    monthly: { zmw: 75000, usd: 2900 },   // K750 / $29
    annual:  { zmw: 72000, usd: 2784 },   // 20% discount
  },
  funded: {
    monthly: { zmw: 200000, usd: 7900 },  // K2000 / $79
    annual:  { zmw: 192000, usd: 7584 },  // 20% discount
  },
};

const DB_PLAN: Record<string, "PRO" | "FUNDED"> = { pro: "PRO", funded: "FUNDED" };

// ── POST /api/checkout/mobile-money ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json() as {
    plan:     "pro" | "funded";
    cycle:    "monthly" | "annual";
    phone:    string;
    operator: string;
    currency: "ZMW" | "USD";
  };

  const prices = PLAN_PRICES[body.plan]?.[body.cycle];
  if (!prices) return NextResponse.json({ error: "Invalid plan or cycle" }, { status: 400 });

  const amount   = body.currency === "ZMW" ? prices.zmw : prices.usd;
  const reference = `smfx_${body.plan}_${dbUser.id}_${Date.now()}`;

  // Create pending subscription record
  const subscription = await prisma.subscription.create({
    data: {
      userId:       dbUser.id,
      plan:         DB_PLAN[body.plan],
      status:       "PENDING",
      lencoReference: reference,
      currency:     body.currency,
      amountCents:  amount,
      billingCycle: body.cycle,
    },
  });

  // Call Lenco API server-side
  const lencoRes = await fetch(`${LENCO_BASE}/collections/mobile-money`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${LENCO_KEY}`,
    },
    body: JSON.stringify({
      amount:    (amount / 100).toFixed(2),
      currency:  body.currency,
      reference,
      phone:     body.phone,
      operator:  body.operator,
    }),
  });

  const lencoData = await lencoRes.json().catch(() => ({}));

  if (!lencoRes.ok || !lencoData.status) {
    // Clean up pending subscription if Lenco rejected the request
    await prisma.subscription.delete({ where: { id: subscription.id } }).catch(() => null);
    const reason = lencoData?.message ?? "Payment initiation failed";
    return NextResponse.json({ error: reason }, { status: 400 });
  }

  return NextResponse.json({
    reference:      lencoData.data?.reference ?? reference,
    lencoReference: lencoData.data?.lencoReference ?? reference,
    status:         lencoData.data?.status ?? "pay-offline",
    subscriptionId: subscription.id,
  });
}
