"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface TableFilter {
  columnId: string;
  label: string;
  options: { value: string; label: string }[];
}

export function DataTable<T>({
  columns,
  data,
  searchPlaceholder = "Search",
  initialSearch = "",
  filters = [],
  initialSorting = [],
  onRowClick,
  rowLabel,
  pageSize = 10,
  empty,
  toolbar,
  rowClassName,
  hiddenColumns = [],
  rowAttrs,
}: {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  searchPlaceholder?: string;
  initialSearch?: string;
  filters?: TableFilter[];
  initialSorting?: SortingState;
  onRowClick?: (row: T) => void;
  rowLabel?: (row: T) => string;
  pageSize?: number;
  empty?: React.ReactNode;
  toolbar?: React.ReactNode;
  rowClassName?: (row: T) => string | undefined;
  hiddenColumns?: string[];
  rowAttrs?: (row: T) => Record<string, string | undefined>;
}) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [globalFilter, setGlobalFilter] = useState(initialSearch);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, columnFilters },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
    initialState: { pagination: { pageSize }, columnVisibility: Object.fromEntries(hiddenColumns.map((c) => [c, false])) },
  });

  const rows = table.getRowModel().rows;
  const total = table.getFilteredRowModel().rows.length;
  const { pageIndex } = table.getState().pagination;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder={searchPlaceholder} aria-label={searchPlaceholder} className="pl-8" />
        </div>
        {filters.map((f) => {
          const col = table.getColumn(f.columnId);
          const v = (col?.getFilterValue() as string) ?? "all";
          return (
            <Select key={f.columnId} value={v} onValueChange={(nv) => col?.setFilterValue(nv === "all" ? undefined : nv)}>
              <SelectTrigger className="w-full sm:w-48" aria-label={f.label}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {f.label.toLowerCase()}</SelectItem>
                {f.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}
        {toolbar && <div className="flex gap-2 sm:ml-auto">{toolbar}</div>}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((h) => {
                  const sortable = h.column.getCanSort();
                  const dir = h.column.getIsSorted();
                  return (
                    <TableHead key={h.id} aria-sort={dir === "asc" ? "ascending" : dir === "desc" ? "descending" : undefined} className="h-10 px-3 whitespace-nowrap">
                      {h.isPlaceholder ? null : sortable ? (
                        <button
                          type="button"
                          onClick={h.column.getToggleSortingHandler()}
                          className="-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {dir === "asc" ? <ArrowUp className="size-3" /> : dir === "desc" ? <ArrowDown className="size-3" /> : <ArrowUpDown className="size-3 opacity-50" />}
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">{flexRender(h.column.columnDef.header, h.getContext())}</span>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="p-0">
                  {empty ?? <p className="p-8 text-center text-sm text-muted-foreground">Nothing matches these filters. Clear the search to see everything.</p>}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow
                  key={r.id}
                  {...rowAttrs?.(r.original)}
                  onClick={onRowClick ? () => onRowClick(r.original) : undefined}
                  onKeyDown={onRowClick ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onRowClick(r.original)) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-label={onRowClick && rowLabel ? rowLabel(r.original) : undefined}
                  className={cn(onRowClick && "cursor-pointer focus-visible:bg-muted focus-visible:outline-none", rowClassName?.(r.original))}
                >
                  {r.getVisibleCells().map((c) => (
                    <TableCell key={c.id} className="px-3 py-2.5">
                      {flexRender(c.column.columnDef.cell, c.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span className="tabular">
          {total === 0 ? "0 rows" : `${pageIndex * table.getState().pagination.pageSize + 1} to ${Math.min(total, (pageIndex + 1) * table.getState().pagination.pageSize)} of ${total}`}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Previous page">
            <ChevronLeft />
          </Button>
          <span className="tabular px-2">
            Page {pageIndex + 1} of {Math.max(1, table.getPageCount())}
          </span>
          <Button variant="outline" size="icon-sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Next page">
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
