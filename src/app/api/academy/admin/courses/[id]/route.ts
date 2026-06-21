import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

async function getInstructor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true, role: true } });
  if (!dbUser || dbUser.role !== "INSTRUCTOR") return null;
  return dbUser;
}

// GET /api/academy/admin/courses/[id] — single course + all lessons
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getInstructor()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: { lessons: { orderBy: { order: "asc" } } },
  });

  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(course);
}

// PATCH /api/academy/admin/courses/[id] — update course fields
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getInstructor()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const body = await req.json() as Partial<{
    title: string; description: string; tier: string;
    icon: string; color: string; order: number; published: boolean;
  }>;

  const course = await prisma.course.update({ where: { id }, data: body });
  return NextResponse.json(course);
}

// DELETE /api/academy/admin/courses/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getInstructor()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
