import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// GET /api/academy/courses — published courses + lessons + user's completedIds

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const courses = await prisma.course.findMany({
    where:   { published: true },
    orderBy: { order: "asc" },
    select: {
      id: true, slug: true, title: true, description: true,
      tier: true, icon: true, color: true, order: true,
      lessons: {
        where:   { published: true },
        orderBy: { order: "asc" },
        select: {
          id: true, slug: true, title: true, duration: true,
          body: true, summary: true, points: true, order: true,
        },
      },
    },
  });

  let completedIds: string[] = [];
  if (user) {
    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } });
    if (dbUser) {
      const progress = await prisma.lessonProgress.findMany({
        where:  { userId: dbUser.id, completed: true },
        select: { lessonId: true },
      });
      completedIds = progress.map((p) => p.lessonId);
    }
  }

  return NextResponse.json({ courses, completedIds });
}
