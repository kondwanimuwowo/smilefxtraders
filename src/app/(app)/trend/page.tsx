import { loadTrendMatrix } from "@/lib/trend-matrix";
import { TrendMatrix } from "./TrendMatrix";

export const metadata = { title: "Trend Matrix | Smile FX Traders" };

// Deliberately NOT the React Query prefetch pattern used by academy, alerts,
// dashboard, community and cot.
//
// The matrix is editable state: the instructor toggles cells and then
// publishes. Treating it as cached server state would put React Query and the
// edit buffer in a tug of war over the same values — a background refetch
// mid-edit would silently discard unsaved work. So the server loads it once
// and hands it over as the initial value of ordinary useState, which is what
// a form seeded from the database actually is.
//
// A failed load is not fatal: TrendMatrix falls back to its built-in defaults
// when `initial` is null, exactly as it did when the fetch failed client-side.
export default async function TrendPage() {
  const initial = await loadTrendMatrix().catch(() => null);
  return <TrendMatrix initial={initial} />;
}
