import * as React from "react";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidePanel } from "@/components/ui/side-panel";

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  width?: string;
}

interface DataTableEmptyProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 15, 25, 50];

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  /** null renders the loading skeleton; [] renders the empty state. */
  data: T[] | null;
  rowKey: (row: T) => string;
  rowClassName?: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty: DataTableEmptyProps;

  /** Top1 — title/subtitle above the toolbar. Skip on pages that already show their own page-level heading (the usual case for a page's main table). */
  title?: string;
  description?: string;

  /** Top2 toolbar — search + entries-per-page + filter button. On by default; set false to hide entirely for small/fixed lists. */
  toolbar?: boolean;
  searchPlaceholder?: string;
  /** How a row is matched against the search query. Defaults to matching against the row's own JSON so search works out of the box without extra config. */
  searchText?: (row: T) => string;
  /** Extra filter controls, opened via the Filter button into a side panel. Omit to hide the Filter button — there's nothing to filter on yet. */
  filters?: React.ReactNode;
  filtersTitle?: string;
  pageSizeOptions?: number[];
  defaultPageSize?: number;

  /** Footer — "X - Y / Total" + pagination. On by default; set false to hide for small/fixed lists. */
  pagination?: boolean;

  className?: string;
}

// Shared loading placeholder — a card of staggered pulse bars, one per column. Used by
// DataTable itself (data === null) and by any bespoke list that visually mirrors DataTable's
// card/header/divider styling but can't use DataTable directly (e.g. SortableFieldList,
// which needs a dnd-kit ref per row) — same skeleton everywhere a table-shaped list loads,
// no per-page variations.
export function TableSkeleton({
  columnWidths,
  rows = 6,
  className,
}: {
  columnWidths: (string | undefined)[];
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4 rounded-xl border border-border bg-card p-5", className)}>
      <div className="divide-y divide-border/70">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-5 py-4">
            {columnWidths.map((width, j) => (
              <div
                key={j}
                className="h-3.5 flex-1 animate-pulse rounded-full bg-muted"
                style={{ maxWidth: width, animationDelay: `${(i * columnWidths.length + j) * 40}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function getPageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const range: (number | "…")[] = [1];
  if (current > 3) range.push("…");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) range.push(i);
  if (current < total - 2) range.push("…");
  range.push(total);
  return range;
}

// Shared list-table shell: card-enclosed, with an optional title/subtitle (top1), a
// search + entries-per-page + filter toolbar (top2), the table itself, and a pagination
// footer. Search/pagination run entirely client-side over the `data` prop for now — there's
// no backend support for either yet, so this keeps the frontend fully usable ahead of that
// (swap to server-driven paging later without changing the shell's look, just its wiring).
export function DataTable<T>({
  columns,
  data,
  rowKey,
  rowClassName,
  onRowClick,
  empty,
  title,
  description,
  toolbar = true,
  searchPlaceholder = "Search…",
  searchText,
  filters,
  filtersTitle = "Filters",
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  defaultPageSize = 15,
  pagination = true,
  className,
}: DataTableProps<T>) {
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(defaultPageSize);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    if (!data || !query.trim()) return data ?? [];
    const q = query.trim().toLowerCase();
    const getText = searchText ?? ((row: T) => JSON.stringify(row));
    return data.filter((row) => getText(row).toLowerCase().includes(q));
  }, [data, query, searchText]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const pageRows = pagination ? filtered.slice((clampedPage - 1) * pageSize, clampedPage * pageSize) : filtered;
  const rangeStart = filtered.length === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(clampedPage * pageSize, filtered.length);

  React.useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  if (data === null) {
    return <TableSkeleton columnWidths={columns.map((c) => c.width)} className={className} />;
  }

  if (data.length === 0) {
    return <EmptyState icon={empty.icon} title={empty.title} description={empty.description} action={empty.action} />;
  }

  return (
    <div className={cn("space-y-4 rounded-xl border border-border bg-card p-5", className)}>
      {(title || description) && (
        <div>
          {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}

      {toolbar && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="rounded-lg border-input bg-muted/50 pl-9 shadow-none"
            />
          </div>

          <div className="flex items-center gap-2">
            {pagination && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="hidden sm:inline">Entries</span>
                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger size="sm" className="w-[70px] rounded-lg border-input bg-muted/50 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {filters && (
              <Button type="button" variant="outline" size="sm" onClick={() => setFiltersOpen(true)}>
                <SlidersHorizontal /> Filter
              </Button>
            )}
          </div>
        </div>
      )}

      {pageRows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No results for “{query}”.</p>
      ) : (
        <div className="overflow-x-auto thin-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={cn(
                      "px-5 py-5 text-left text-[11px] font-semibold tracking-wide text-primary uppercase",
                      col.headerClassName,
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {pageRows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "transition-colors hover:bg-muted/40",
                    onRowClick && "cursor-pointer",
                    rowClassName?.(row),
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-5 py-3.5 align-middle", col.cellClassName)}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && filtered.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {rangeStart} - {rangeEnd} / {filtered.length}
          </p>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              disabled={clampedPage <= 1}
              onClick={() => setPage(clampedPage - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>

            {getPageRange(clampedPage, pageCount).map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} className="px-1.5 text-sm text-muted-foreground">
                  …
                </span>
              ) : (
                <Button
                  key={p}
                  type="button"
                  variant={p === clampedPage ? "default" : "outline"}
                  size="icon"
                  className="size-8"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ),
            )}

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              disabled={clampedPage >= pageCount}
              onClick={() => setPage(clampedPage + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {filters && (
        <SidePanel open={filtersOpen} onOpenChange={setFiltersOpen} size="xs" title={filtersTitle}>
          {filters}
        </SidePanel>
      )}
    </div>
  );
}
