import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// ── GET /api/academy/progress — completed lesson IDs for current user ─────────

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 200 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } }).catch(() => null);
  if (!dbUser) return NextResponse.json([], { status: 200 });

  const progress = await prisma.lessonProgress.findMany({
    where:  { userId: dbUser.id, completed: true },
    select: { lessonId: true },
  });

  return NextResponse.json(progress.map((p) => p.lessonId));
}

// ── POST /api/academy/progress — mark a lesson complete ──────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { lessonId, completed = true } = await req.json() as { lessonId: string; completed?: boolean };

  // Upsert — create or update the progress record
  const progress = await prisma.lessonProgress.upsert({
    where:  { userId_lessonId: { userId: dbUser.id, lessonId } },
    update: { completed, completedAt: completed ? new Date() : null },
    create: { userId: dbUser.id, lessonId, completed, completedAt: completed ? new Date() : null },
  });

  return NextResponse.json({ lessonId: progress.lessonId, completed: progress.completed });
}
