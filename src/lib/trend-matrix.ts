import { prisma } from "@/lib/prisma";
import { isAutoFresh, TREND_TFS, type TrendBias, type TrendTf } from "@/lib/trend/structure";

export const TREND_MATRIX_SINGLETON_ID = "singleton";

export interface TrendCell {
  bias:   TrendBias;
  source: "auto" | "instructor";
  /** When the auto read was computed, or when the instructor set the override. */
  asOf:   string;
  /** Override only: when it lapses back to the auto read. */
  expiresAt?: string;
  /** Auto only: the structure break behind the read. */
  lastBreak?: { type: string; dir: string; price: number; at: string } | null;
  /** The auto read under an active override, so the instructor can see what they are overriding. */
  autoBias?: TrendBias | null;
}

export interface TrendMatrixData {
  /** Effective bias per pair and timeframe. Missing cells mean no current read. */
  matrix:    Record<string, Partial<Record<TrendTf, TrendBias>>>;
  cells:     Record<string, Partial<Record<TrendTf, TrendCell>>>;
  notes:     Record<string, string>;
  updatedAt: string | null;
}

/**
 * The Trend Matrix every consumer reads: the pair hub verdict, MacroEdge
 * confluence, the dashboard and /trend.
 *
 * An active instructor override wins. Otherwise the computed structure is
 * used, but only while it is fresh. A cell that is neither is left out, so
 * consumers show "no data" instead of a stale bias dressed up as current,
 * which is how the old hand-maintained matrix went ten weeks out of date.
 *
 * Server-only. Returns exactly what GET /api/trend-matrix returns, so the
 * dashboard's prefetched cache entry is interchangeable with a client fetch.
 */
export async function loadTrendMatrix(now = new Date()): Promise<TrendMatrixData> {
  const [structures, overrides, notesRow] = await Promise.all([
    prisma.trendStructure.findMany(),
    prisma.trendOverride.findMany({ where: { expiresAt: { gt: now } } }),
    prisma.trendMatrix.findUnique({ where: { id: TREND_MATRIX_SINGLETON_ID }, select: { notes: true, updatedAt: true } }),
  ]);

  const matrix: TrendMatrixData["matrix"] = {};
  const cells:  TrendMatrixData["cells"]  = {};
  const set = (pair: string, tf: TrendTf, cell: TrendCell) => {
    (matrix[pair] ??= {})[tf] = cell.bias;
    (cells[pair]  ??= {})[tf] = cell;
  };
  let latest = notesRow?.updatedAt ?? null;
  const bump = (d: Date) => { if (!latest || d > latest) latest = d; };

  const autoByKey = new Map<string, TrendBias>();
  for (const s of structures) {
    const tf = s.tf as TrendTf;
    if (!TREND_TFS.includes(tf) || !isAutoFresh(tf, s.computedAt, now)) continue;
    autoByKey.set(`${s.pair}:${tf}`, s.bias);
    bump(s.computedAt);
    set(s.pair, tf, {
      bias:   s.bias,
      source: "auto",
      asOf:   s.computedAt.toISOString(),
      lastBreak: s.lastBreakType && s.lastBreakDir && s.lastBreakPrice != null && s.lastBreakAt
        ? { type: s.lastBreakType, dir: s.lastBreakDir, price: s.lastBreakPrice, at: s.lastBreakAt.toISOString() }
        : null,
    });
  }

  for (const o of overrides) {
    const tf = o.tf as TrendTf;
    if (!TREND_TFS.includes(tf)) continue;
    bump(o.setAt);
    set(o.pair, tf, {
      bias:      o.bias,
      source:    "instructor",
      asOf:      o.setAt.toISOString(),
      expiresAt: o.expiresAt.toISOString(),
      autoBias:  autoByKey.get(`${o.pair}:${tf}`) ?? null,
    });
  }

  return {
    matrix,
    cells,
    notes:     (notesRow?.notes as Record<string, string> | undefined) ?? {},
    updatedAt: latest ? (latest as Date).toISOString() : null,
  };
}
