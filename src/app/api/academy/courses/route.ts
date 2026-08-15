import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { loadAcademyCourses } from "@/lib/academy";

// GET /api/academy/courses — published courses + lessons + user's completedIds
//
// The query itself lives in lib/academy.ts because (app)/academy/page.tsx
// prefetches the same data server-side. This route remains the client's path
// for refetching after a lesson is marked complete.

export async function GET() {
  try {
    return NextResponse.json(await loadAcademyCourses());
  } catch (err) {
    return handleApiError("academy/courses", err);
  }
}
