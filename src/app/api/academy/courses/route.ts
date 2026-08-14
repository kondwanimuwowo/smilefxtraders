import { NextResponse } from "next/server";
import { createClient, getAuthedUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

// GET /api/academy/courses — published courses + lessons + user's completedIds

export async function GET() {
  try {
    return await handleGet();
  } catch (err) {
    return handleApiError("academy/courses", err);
  }
}

async function handleGet() {
  const supabase = await createClient();
  const user = await getAuthedUser(supabase);

  // courses and the user lookup are independent -- were sequential, each
  // one an extra round trip the request could stall on. Running them
  // together halves the sequential DB hops before completedIds (which does
  // genuinely depend on dbUser.id) can even start. See 2026-08-14
  // query-volume audit.
  const [courses, dbUser] = await Promise.all([
    prisma.course.findMany({
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
    }),
    user
      ? prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } })
      : Promise.resolve(null),
  ]);

  let completedIds: string[] = [];
  if (dbUser) {
    const progress = await prisma.lessonProgress.findMany({
      where:  { userId: dbUser.id, completed: true },
      select: { lessonId: true },
    });
    completedIds = progress.map((p) => p.lessonId);
  }

  return NextResponse.json({ courses, completedIds });
}
