import { createClient, getAuthedUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const COMMUNITY_PAGE_SIZE = 20;

function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * One page of the community feed, newest first.
 *
 * Server-only, shared by /api/community/posts and (app)/community/page.tsx's
 * prefetch of the first page. Returns exactly the PostsPage shape the client's
 * useInfiniteQuery expects, so a prefetched first page is interchangeable with
 * one the client fetched itself.
 *
 * Note `likedByMe`: this payload is per-user, not shared. The server prefetch
 * is safe only because getServerQueryClient() is scoped per request via React
 * cache() — a module-level QueryClient would serve one member's like state to
 * another.
 */
export async function loadCommunityPosts(cursor?: string) {
  const take = COMMUNITY_PAGE_SIZE;

  const posts = await prisma.post.findMany({
    take:    take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      author:   { select: { id: true, name: true, username: true, role: true, avatarUrl: true } },
      likes:    { select: { userId: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      },
    },
  });

  const hasMore    = posts.length > take;
  const pageItems  = hasMore ? posts.slice(0, take) : posts;
  const nextCursor = hasMore ? pageItems[pageItems.length - 1].id : null;

  const supabase = await createClient();
  const user = await getAuthedUser(supabase);
  const dbUser = user
    ? await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } }).catch(() => null)
    : null;

  const formatted = pageItems.map((p) => ({
    id:           p.id,
    name:         p.author.name,
    handle:       p.author.username,
    avatarSeed:   seedFromId(p.author.id),
    avatarUrl:    p.author.avatarUrl,
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
      avatarUrl:  c.author.avatarUrl,
      text:       c.text,
      time:       c.createdAt.toISOString(),
    })),
  }));

  return { posts: formatted, nextCursor };
}
