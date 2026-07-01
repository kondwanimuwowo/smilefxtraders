import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PRICES } from "@/lib/plans";

async function getUser(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase.auth.getUser(token);
  if (!data.user) return null;
  return prisma.user.findUnique({ where: { supabaseId: data.user.id }, select: { role: true } });
}

export async function GET() {
  const rows = await prisma.planConfig.findMany();
  const byId = Object.fromEntries(rows.map((r) => [r.planId, r]));

  const configs = DEFAULT_PRICES.map((d) => ({
    planId:     d.planId,
    monthlyZmw: byId[d.planId]?.monthlyZmw ?? d.monthlyZmw,
    annualZmw:  byId[d.planId]?.annualZmw  ?? d.annualZmw,
    monthlyUsd: byId[d.planId]?.monthlyUsd ?? d.monthlyUsd,
    annualUsd:  byId[d.planId]?.annualUsd  ?? d.annualUsd,
  }));

  return NextResponse.json(configs);
}

export async function PATCH(req: Request) {
  const user = await getUser(req);
  if (!user || user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as {
    planId: string;
    monthlyZmw: number;
    annualZmw: number;
    monthlyUsd: number;
    annualUsd: number;
  };

  const validIds = ["free", "pro", "funded"];
  if (!validIds.includes(body.planId)) {
    return NextResponse.json({ error: "Invalid planId" }, { status: 400 });
  }

  const config = await prisma.planConfig.upsert({
    where:  { planId: body.planId },
    update: { monthlyZmw: body.monthlyZmw, annualZmw: body.annualZmw, monthlyUsd: body.monthlyUsd, annualUsd: body.annualUsd },
    create: { planId: body.planId, monthlyZmw: body.monthlyZmw, annualZmw: body.annualZmw, monthlyUsd: body.monthlyUsd, annualUsd: body.annualUsd },
  });

  return NextResponse.json(config);
}
