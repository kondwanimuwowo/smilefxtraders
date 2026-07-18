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

// GET /api/academy/admin/courses — all courses (including unpublished)
export async function GET() {
  if (!await getInstructor()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const courses = await prisma.course.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true, slug: true, title: true, description: true,
      tier: true, icon: true, color: true, order: true, published: true,
      lessons: { select: { id: true }, where: { published: true } },
    },
  });

  return NextResponse.json(courses.map((c) => ({ ...c, lessonCount: c.lessons.length, lessons: undefined })));
}

// POST /api/academy/admin/courses — create a new course
export async function POST(req: NextRequest) {
  if (!await getInstructor()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as {
    slug: string; title: string; description?: string;
    tier?: string; icon?: string; color?: string; order?: number;
  };

  const course = await prisma.course.create({
    data: {
      slug:        body.slug,
      title:       body.title,
      description: body.description ?? "",
      tier:        body.tier        ?? "pro",
      icon:        body.icon        ?? "school",
      color:       body.color       ?? "var(--teal)",
      order:       body.order       ?? 99,
      published:   false,
    },
  });

  return NextResponse.json(course, { status: 201 });
}
