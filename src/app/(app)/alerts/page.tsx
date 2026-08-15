import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getServerQueryClient } from "@/lib/query-server";
import { loadInstructorAlerts } from "@/lib/alerts";
import { Alerts } from "./Alerts";

export const metadata = { title: "Setup Alerts | Smile FX Traders" };

// See (app)/academy/page.tsx for the pattern and its two failure modes.
export default async function AlertsPage() {
  const queryClient = getServerQueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["alerts"],
    queryFn: loadInstructorAlerts,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Alerts />
    </HydrationBoundary>
  );
}
