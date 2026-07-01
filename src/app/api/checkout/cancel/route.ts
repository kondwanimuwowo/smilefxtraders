import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { plan: true } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (dbUser.plan === "FREE") {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  // Mark subscription cancelled — access remains until billing period ends
  await prisma.user.update({
    where: { id: user.id },
    data: { plan: "FREE" },
  });

  return NextResponse.json({ ok: true });
}
