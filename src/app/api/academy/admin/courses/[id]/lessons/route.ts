import { NextRequest, NextResponse } from "next/server";
import { createClient, getAuthedUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

async function getInstructor() {
  const supabase = await createClient();
  const user = await getAuthedUser(supabase);
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true, role: true } });
  if (!dbUser || dbUser.role !== "INSTRUCTOR") return null;
  return dbUser;
}

// POST /api/academy/admin/courses/[id]/lessons — create a new lesson
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getInstructor()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: courseId } = await params;

  const body = await req.json() as {
    slug: string; title: string; duration?: string;
    body?: string; summary?: string; order?: number;
  };

  const lesson = await prisma.lesson.create({
    data: {
      courseId,
      slug:      body.slug,
      title:     body.title,
      duration:  body.duration  ?? "0 min",
      body:      body.body      ?? null,
      summary:   body.summary   ?? "",
      points:    [],
      level:     1,
      order:     body.order     ?? 99,
      published: false,
    },
  });

  return NextResponse.json(lesson, { status: 201 });
}
