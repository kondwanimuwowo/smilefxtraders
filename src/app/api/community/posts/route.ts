import { NextRequest, NextResponse } from "next/server";
import { createClient, getAuthedUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";
import { loadCommunityPosts } from "@/lib/community";

function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

// ── GET /api/community/posts — paginated feed ─────────────────────────────────
// Query lives in lib/community.ts so the page's prefetch of the first page and
// this route return an identical PostsPage shape.

export async function GET(req: NextRequest) {
  try {
    const cursor = new URL(req.url).searchParams.get("cursor") ?? undefined;
    return NextResponse.json(await loadCommunityPosts(cursor));
  } catch (err) {
    return handleApiError("community/posts:GET", err);
  }
}

// ── POST /api/community/posts — create a post ─────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (dbUser.plan === "FREE") {
      return NextResponse.json({ error: "Community posting requires an Edge or Pro plan." }, { status: 403 });
    }

    const body = await req.json() as { text: string; pair?: string; dir?: string; result?: string };
    const { text, pair, dir, result } = body;

    if (!text?.trim()) return NextResponse.json({ error: "Post text is required" }, { status: 400 });

    // Normalise direction to DB enum (client sends "long"/"short")
    const dirEnum = dir ? (dir.toUpperCase() as "LONG" | "SHORT") : null;
    // Normalise result to DB enum (client sends "WIN"/"LOSS" — already uppercase)
    const resultEnum = result ? (result as "WIN" | "LOSS") : null;

    const post = await prisma.post.create({
      data: {
        authorId: dbUser.id,
        text:     text.trim(),
        pair:     pair ?? null,
        dir:      dirEnum,
        result:   resultEnum,
      },
      include: {
        author:   { select: { id: true, name: true, username: true, role: true, avatarUrl: true } },
        likes:    { select: { userId: true } },
        comments: true,
      },
    });

    return NextResponse.json({
      id:           post.id,
      name:         post.author.name,
      handle:       post.author.username,
      avatarSeed:   seedFromId(post.author.id),
      avatarUrl:    post.author.avatarUrl,
      isInstructor: post.author.role === "INSTRUCTOR",
      pair:         post.pair,
      dir:          post.dir ? post.dir.toLowerCase() : null,
      result:       post.result,
      text:         post.text,
      time:         post.createdAt.toISOString(),
      likes:        0,
      likedByMe:    false,
      comments:     0,
      commentList:  [],
    }, { status: 201 });
  } catch (err) {
    return handleApiError("community/posts:POST", err);
  }
}
