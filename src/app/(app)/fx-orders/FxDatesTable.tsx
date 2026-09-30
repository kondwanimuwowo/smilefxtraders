"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { Icon, Select, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { PAIR_LABELS } from "@/types/fx-orders";
import type { FxDateSummary } from "@/types/fx-orders";

// One row per expiry date, replacing the old card grid: at ~60 dates the
// cards ran to several screens of scrolling, while a paged table keeps the
// archive to a single glanceable block.

const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel:    createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns,
});

const helper = createColumnHelper<typeof features, FxDateSummary>();

// `cls` hides secondary columns on narrow screens, the same breakpoint
// approach as the Journal table.
type ColumnMeta = { cls?: string };

const columns = helper.columns([
  helper.accessor("date", {
    header: "Date",
    sortFn: "basic", // ISO strings sort chronologically as plain strings
    sortDescFirst: true,
    meta: { cls: "" } satisfies ColumnMeta,
  }),
  helper.accessor("dayName", {
    header: "Day",
    enableSorting: false,
    meta: { cls: "hidden sm:table-cell" } satisfies ColumnMeta,
  }),
  helper.accessor("pairCount", {
    header: "Pairs",
    sortFn: "basic",
    sortDescFirst: true,
    meta: { cls: "text-right" } satisfies ColumnMeta,
  }),
  helper.accessor("levelCount", {
    header: "Levels",
    sortFn: "basic",
    sortDescFirst: true,
    meta: { cls: "text-right" } satisfies ColumnMeta,
  }),
  helper.accessor("pairs", {
    header: "Coverage",
    enableSorting: false,
    meta: { cls: "hidden lg:table-cell" } satisfies ColumnMeta,
  }),
]);

const PAGE_SIZE_OPTIONS = ["10", "20", "50"];

function formatDate(iso: string): string {
  const [, mm, dd] = iso.split("-");
  return `${dd}/${mm}`;
}

// ── Cells ─────────────────────────────────────────────────────────────────────

function DateCell({ summary, isToday }: { summary: FxDateSummary; isToday: boolean }) {
  return (
    <Link
      href={`/fx-orders/${summary.date}`}
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-2 outline-none focus-visible:underline"
    >
      <span className="font-display font-bold tabular-nums text-[14px] text-ink-strong">
        {formatDate(summary.date)}
      </span>
      {isToday && (
        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-teal-tint-soft text-teal-deep">
          Today
        </span>
      )}
      {/* The Day column is hidden on phones; keep the weekday visible here. */}
      <span className="sm:hidden text-[11.5px] text-ink-dim">{summary.dayName.slice(0, 3)}</span>
    </Link>
  );
}

function PairChips({ pairs }: { pairs: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {pairs.map((pair) => (
        <span
          key={pair}
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-panel-2 text-ink-dim tracking-[0.01em]"
        >
          {PAIR_LABELS[pair] ?? pair}
        </span>
      ))}
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────

export function FxDatesTable({ data, today }: { data: FxDateSummary[]; today: string }) {
  const router = useRouter();

  const table = useTable({
    features,
    columns,
    data,
    initialState: {
      sorting:    [{ id: "date", desc: true }],
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  });

  const { pageIndex, pageSize } = table.state.pagination;
  const total = table.getRowCount();
  const first = total === 0 ? 0 : pageIndex * pageSize + 1;
  const last  = Math.min(total, (pageIndex + 1) * pageSize);

  return (
    <div className="rounded-2xl overflow-hidden bg-panel shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} className="bg-panel-2">
                {group.headers.map((header) => {
                  const meta     = header.column.columnDef.meta as ColumnMeta | undefined;
                  const sortable = header.column.getCanSort();
                  const sorted   = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                      className={cn("px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-dim", meta?.cls)}
                    >
                      {sortable ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            header.column.getToggleSortingHandler()?.(e);
                            // Re-sorting while on page 4 should show the new
                            // top rows, not page 4 of the new order.
                            table.setPageIndex(0);
                          }}
                          className={cn(
                            "inline-flex items-center gap-0.5 uppercase tracking-wider transition-colors hover:text-ink-mid",
                            sorted && "text-ink-mid"
                          )}
                        >
                          <table.FlexRender header={header} />
                          <Icon
                            name={sorted === "asc" ? "arrow_upward" : "arrow_downward"}
                            size={12}
                            className={sorted ? "" : "opacity-0"}
                          />
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </th>
                  );
                })}
                <th className="w-10" aria-hidden />
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const s       = row.original;
              const isToday = s.date === today;
              return (
                <tr
                  key={row.id}
                  onClick={() => router.push(`/fx-orders/${s.date}`)}
                  className={cn(
                    "group cursor-pointer border-t border-line transition-colors hover:bg-hover",
                    isToday && "bg-teal-tint-soft"
                  )}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <DateCell summary={s} isToday={isToday} />
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-[12.5px] text-ink-mid">
                    {s.dayName}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[13px] font-semibold text-ink">
                    {s.pairCount}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[13px] font-semibold text-ink">
                    {s.levelCount}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <PairChips pairs={s.pairs} />
                  </td>
                  <td className="pr-4 py-3 text-right">
                    <Icon
                      name="chevron_right"
                      size={18}
                      className="text-ink-dim transition-transform group-hover:translate-x-0.5"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer: range, rows per page, prev/next */}
      <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 bg-panel-2">
        <span className="text-[12px] tabular-nums text-ink-dim">
          {first}–{last} of {total} dates
        </span>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[12px] text-ink-dim">Rows</span>
            <div className="w-[70px]">
              <Select
                compact
                value={String(pageSize)}
                onChange={(v) => table.setPageSize(Number(v))}
                options={PAGE_SIZE_OPTIONS}
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
              className="p-1.5 rounded-lg hover:bg-hover disabled:opacity-30 transition-colors text-ink-mid"
            >
              <Icon name="chevron_left" size={18} />
            </button>
            <span className="text-[12px] tabular-nums text-ink-mid min-w-[64px] text-center">
              {pageIndex + 1} / {Math.max(1, table.getPageCount())}
            </span>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
              className="p-1.5 rounded-lg hover:bg-hover disabled:opacity-30 transition-colors text-ink-mid"
            >
              <Icon name="chevron_right" size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FxDatesTableSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-panel shadow-md">
      <div className="h-9 bg-panel-2" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-6 px-4 py-3.5 border-t border-line">
          <Skeleton h={14} r={4} style={{ width: 56 }} />
          <Skeleton h={12} r={4} style={{ width: 70 }} />
          <div className="flex-1" />
          <Skeleton h={12} r={4} style={{ width: 24 }} />
          <Skeleton h={12} r={4} style={{ width: 24 }} />
        </div>
      ))}
      <div className="h-12 bg-panel-2" />
    </div>
  );
}
