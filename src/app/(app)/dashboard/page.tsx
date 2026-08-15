import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getServerQueryClient } from "@/lib/query-server";
import { loadInstructorAlerts } from "@/lib/alerts";
import { loadTrendMatrix } from "@/lib/trend-matrix";
import { loadCalendarEvents } from "@/lib/calendar";
import { selectTodayEvents } from "@/lib/calendar-select";
import { fmtISODate } from "@/lib/date";
import { Dashboard } from "./Dashboard";

export const metadata = { title: "Dashboard | Smile FX Traders" };

// See (app)/academy/page.tsx for the pattern and its two failure modes.
//
// All three of the dashboard's queries are prefetched. ["calendar", "today"]
// needed the filter extracting first: it used to live inline in Dashboard's
// queryFn, so prefetching it would have meant a second copy of "impact >= 2"
// on the server. selectTodayEvents is now the single definition, imported by
// both sides — which is the general answer whenever a query key encodes a
// client-side transform.
//
// Run in parallel: these are independent, and awaiting them in sequence would
// make the page wait for the sum rather than the slower of the three.
export default async function DashboardPage() {
  const queryClient = getServerQueryClient();

  await Promise.all([
    queryClient.prefetchQuery({ queryKey: ["alerts"], queryFn: loadInstructorAlerts }),
    queryClient.prefetchQuery({ queryKey: ["trend-matrix"], queryFn: loadTrendMatrix }),
    queryClient.prefetchQuery({
      queryKey: ["calendar", "today"],
      // Server clock. The client recomputes with its own date on refetch,
      // which is what we want either side of midnight in a user's timezone.
      queryFn: async () => selectTodayEvents(await loadCalendarEvents(), fmtISODate(new Date())),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Dashboard />
    </HydrationBoundary>
  );
}
