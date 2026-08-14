import { TrendMatrix } from "./TrendMatrix";

export const metadata = { title: "Trend Matrix | Smile FX Traders" };

// isInstructor used to be resolved here via an independent
// supabase.auth.getUser() + prisma.user.findUnique -- duplicating work
// (app)/layout.tsx already does on every navigation to hydrate the same
// user into the Zustand store. It's a UI-only convenience flag (the actual
// write path, POST /api/trend-matrix, independently re-verifies the role
// server-side), so TrendMatrix now reads it straight from the store instead
// -- see 2026-08-14 query-volume audit.
export default function TrendMatrixPage() {
  return <TrendMatrix />;
}
