import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getServerQueryClient } from "@/lib/query-server";
import { loadAcademyCourses } from "@/lib/academy";
import { Academy } from "./Academy";

export const metadata = { title: "Academy | Smile FX Traders" };

// Pattern reference for moving an (app) page off client-only fetching.
//
// Before: this was a 3-line shell rendering <Academy />, which mounted, fired
// GET /api/academy/courses, and showed a skeleton until it returned. The data
// therefore cost a browser -> Worker -> database round trip that the server
// rendering the page could have made itself.
//
// Now the server prefetches with the SAME query key the client uses, and
// HydrationBoundary hands the result over, so useCourses() finds it already
// cached and paints real content immediately. Academy.tsx is unchanged: it
// still owns refetching after a lesson is completed, and still works if the
// prefetch fails.
//
// The query key must match the client's exactly (["academy-courses"]) or the
// prefetch is silently ignored and you get the old behaviour with extra work.
export default async function AcademyPage() {
  const queryClient = getServerQueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["academy-courses"],
    queryFn: loadAcademyCourses,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Academy />
    </HydrationBoundary>
  );
}
