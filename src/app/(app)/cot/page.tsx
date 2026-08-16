import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getServerQueryClient } from "@/lib/query-server";
import { loadCotOverview } from "@/lib/cot/overview";
import { CotReports } from "./CotReports";

export const metadata = { title: "COT Reports | Smile FX Traders" };

// See (app)/academy/page.tsx for the pattern and its two failure modes.
//
// setQueryData rather than prefetchQuery: the loader already returns exactly
// the { locked, entries } shape the client's queryFn produces, so there is no
// second function to run — just a value to seed.
//
// The locked case is seeded too. The plan check is server-authoritative, so a
// FREE member gets the lock screen on first paint instead of a round trip
// that was only ever going to come back 403. Unauthenticated cannot reach
// here; (app)/layout.tsx redirects to /login before this renders.
export default async function CotPage() {
  const queryClient = getServerQueryClient();
  const result = await loadCotOverview();

  // Seed only a settled answer. When the plan check couldn't run, seeding
  // would hand the client a lock screen it has no reason to re-question —
  // leaving the cache empty makes it fetch and retry instead, which is what
  // a transient auth failure needs.
  if (!result.unavailable) queryClient.setQueryData(["cot"], result);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CotReports />
    </HydrationBoundary>
  );
}
