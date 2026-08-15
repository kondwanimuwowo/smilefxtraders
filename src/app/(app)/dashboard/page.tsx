import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getServerQueryClient } from "@/lib/query-server";
import { loadInstructorAlerts } from "@/lib/alerts";
import { loadTrendMatrix } from "@/lib/trend-matrix";
import { Dashboard } from "./Dashboard";

export const metadata = { title: "Dashboard | Smile FX Traders" };

// See (app)/academy/page.tsx for the pattern and its two failure modes.
//
// Two of the dashboard's three queries are prefetched. The third,
// ["calendar", "today"], is deliberately left to the client: its query key
// holds a *client-side transform* (filter to today, impact >= 2, sort by
// time) that lives in the queryFn, so prefetching it would mean writing that
// filter a second time on the server and keeping the two in step. Worth doing
// properly by moving the filter server-side, not worth forking the logic for.
//
// Run in parallel: these are independent, and awaiting them in sequence would
// make the page wait for the sum rather than the slower of the two.
export default async function DashboardPage() {
  const queryClient = getServerQueryClient();

  await Promise.all([
    queryClient.prefetchQuery({ queryKey: ["alerts"], queryFn: loadInstructorAlerts }),
    queryClient.prefetchQuery({ queryKey: ["trend-matrix"], queryFn: loadTrendMatrix }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Dashboard />
    </HydrationBoundary>
  );
}
