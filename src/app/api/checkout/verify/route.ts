import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

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
      const renewsAt = new Date(now);
      renewsAt.setMonth(renewsAt.getMonth() + (sub.billingCycle === "annual" ? 12 : 1));

      await prisma.$transaction([
        prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status:    "ACTIVE",
            startedAt: now,
            renewsAt,
          },
        }),
        prisma.user.update({
          where: { id: dbUser.id },
          data:  { plan: sub.plan },
        }),
      ]);
    }
  }

  return NextResponse.json({
    status:    collectionStatus,
    activated: collectionStatus === "successful",
  });
}
