import { prisma } from "@/lib/prisma";

export const TREND_MATRIX_SINGLETON_ID = "singleton";

/**
 * The shared instructor trend matrix, or null if Kondwani hasn't published
 * one yet.
 *
 * Server-only, shared by /api/trend-matrix and the dashboard's prefetch.
 * Returns exactly the shape the client's queryFn returns, so the prefetched
 * cache entry is interchangeable with a client fetch.
 */
export async function loadTrendMatrix() {
  const row = await prisma.trendMatrix.findUnique({
    where: { id: TREND_MATRIX_SINGLETON_ID },
  });
  if (!row) return null;
  return {
    matrix:    row.matrix,
    notes:     row.notes,
    updatedAt: row.updatedAt.toISOString(),
  };
}
