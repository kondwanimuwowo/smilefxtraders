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

// PATCH /api/academy/admin/courses/[id]/lessons/[lessonId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  if (!await getInstructor()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { lessonId } = await params;

  const body = await req.json() as Partial<{
    title: string; duration: string; body: string;
    summary: string; points: string[]; videoUrl: string;
    published: boolean; order: number;
  }>;

  const lesson = await prisma.lesson.update({ where: { id: lessonId }, data: body });
  return NextResponse.json(lesson);
}

// DELETE /api/academy/admin/courses/[id]/lessons/[lessonId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  if (!await getInstructor()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { lessonId } = await params;
  await prisma.lesson.delete({ where: { id: lessonId } });
  return NextResponse.json({ deleted: true });
}
