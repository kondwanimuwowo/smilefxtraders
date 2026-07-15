import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

// ── GET /api/community/posts — paginated feed ─────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const take   = 20;

    const posts = await prisma.post.findMany({
      take:    take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        author:   { select: { id: true, name: true, username: true, role: true } },
        likes:    { select: { userId: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true } } },
        },
      },
    });

    const hasMore    = posts.length > take;
    const pageItems  = hasMore ? posts.slice(0, take) : posts;
    const nextCursor = hasMore ? pageItems[pageItems.length - 1].id : null;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const dbUser = user
      ? await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } }).catch(() => null)
      : null;

    const formatted = pageItems.map((p) => ({
      id:           p.id,
      name:         p.author.name,
      handle:       p.author.username,
      avatarSeed:   seedFromId(p.author.id),
      isInstructor: p.author.role === "INSTRUCTOR",
      pair:         p.pair,
      dir:          p.dir ? p.dir.toLowerCase() : null,
      result:       p.result,
      text:         p.text,
      time:         p.createdAt.toISOString(),
      likes:        p.likes.length,
      likedByMe:    dbUser ? p.likes.some((l) => l.userId === dbUser.id) : false,
      comments:     p.comments.length,
      commentList:  p.comments.map((c) => ({
        id:         c.id,
        name:       c.author.name,
        avatarSeed: seedFromId(c.author.id),
        text:       c.text,
        time:       c.createdAt.toISOString(),
      })),
    }));

    return NextResponse.json({ posts: formatted, nextCursor });
  } catch (err) {
    console.error("[GET /api/community/posts]", err);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}

// ── POST /api/community/posts — create a post ─────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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
        author:   { select: { id: true, name: true, username: true, role: true } },
        likes:    { select: { userId: true } },
        comments: true,
      },
    });

    return NextResponse.json({
      id:           post.id,
      name:         post.author.name,
      handle:       post.author.username,
      avatarSeed:   seedFromId(post.author.id),
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
    console.error("[POST /api/community/posts]", err);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
