import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getServerQueryClient } from "@/lib/query-server";
import { loadCommunityPosts } from "@/lib/community";
import { Community } from "./Community";

export const metadata = { title: "Community | Smile FX Traders" };

// See (app)/academy/page.tsx for the pattern and its two failure modes.
//
// Infinite queries need prefetchInfiniteQuery, and `initialPageParam` must
// match the client's exactly (null) — React Query keys the first page by it,
// so a mismatch caches a page the client never looks for and the feed
// skeletons anyway.
//
// Only the first page is prefetched. Later pages are fetched on scroll, which
// is when the reader asks for them.
//
// ["community-overview"] is deliberately NOT prefetched: its route sets
// `revalidate = 900`, so it is already served from a 15-minute ISR cache.
// Prefetching would replace a cache hit with a fresh Prisma query on every
// load — slower, not faster. Worth checking for `revalidate` before applying
// this pattern anywhere else.
export default async function CommunityPage() {
  const queryClient = getServerQueryClient();

  await queryClient.prefetchInfiniteQuery({
    queryKey: ["community-posts"],
    queryFn: () => loadCommunityPosts(),
    initialPageParam: null as string | null,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Community />
    </HydrationBoundary>
  );
}
