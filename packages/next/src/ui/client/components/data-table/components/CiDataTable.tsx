"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";

import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type CiDataTableCursorPage,
  type CiDataTableCursorQuery,
  type CiDataTableDataMode,
  type CiDataTableInterface,
  type CiDataTablePageCache,
} from "@ci-next/ui/client";

import { buildDataTableColumnsWithActions } from "../lib/build-data-table-columns-with-actions";
import { CiDataTableRowActionsMenu } from "./CiDataTableRowActionsMenu";

// Simple debounce hook
function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function CiDataTable<TData, TValue>({
  title,
  description,
  columns,
  data,
  source,
  rowActions,
  searchPlaceholder = "Search...",
  className,
  config,
  direction,
}: CiDataTableInterface<TData, TValue>) {
  const {
    mode = "auto",
    pageSize = 25,
    debounceMs = 250,
    maxCachedPages = 5,
    prefetchNextPage = false,
    cacheKey = "default",
  } = config ?? {};

  // Default behavior is “smart” without requiring the developer to think about it.
  // Developers can force 'server' if they dislike hybrid caching.
  // Developers can force 'client' for preloaded data pages.
  const effectiveMode: Exclude<CiDataTableDataMode, "auto"> =
    mode === "auto"
      ? source
        ? "hybrid"
        : "client"
      : mode === "client"
      ? "client"
      : source
      ? mode
      : "client";

  // UI state
  const [sorting, setSorting] = useState<SortingState>([]);
  const sortSpec = useMemo(
    () => sorting.map((s) => ({ id: s.id, desc: s.desc })),
    [sorting],
  );

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, debounceMs);

  // Cursor state
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]); // for Prev
  const [page, setPage] = useState<CiDataTableCursorPage<TData>>({ rows: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Hybrid cache
  const cacheRef = useRef<CiDataTablePageCache<TData>>(new Map());

  const columnsWithActions = useMemo<ColumnDef<TData, TValue>[]>(() => {
    return buildDataTableColumnsWithActions<TData, TValue>({
      columns,
      rowActions,
      actionsHeader: "Actions",
      renderActionsCell: (ctx, actions) => (
        <div className="flex justify-start rtl:justify-end">
          <CiDataTableRowActionsMenu row={ctx.row.original} actions={actions} />
        </div>
      ),
    });
  }, [columns, rowActions]);

  const table = useReactTable({
    data: effectiveMode === "client" ? data ?? [] : page.rows,
    columns: columnsWithActions,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: effectiveMode !== "client", // server/hybrid sorting
  });

  // Reset paging when search/sort changes (server/hybrid)
  useEffect(() => {
    if (effectiveMode === "client") return;
    setCursor(null);
    setCursorStack([null]);
    // optional: clear cache on new search/sort to avoid stale pages
    cacheRef.current.clear();
  }, [effectiveMode, debouncedSearch, JSON.stringify(sortSpec)]);

  const makeCacheKey = useCallback(
    (q: CiDataTableCursorQuery) =>
      `${cacheKey}:${JSON.stringify({
        s: q.search ?? "",
        sort: q.sort ?? [],
        c: q.cursor ?? null,
        ps: q.pageSize,
      })}`,
    [cacheKey],
  );

  const trimCacheIfNeeded = useCallback(() => {
    const cache = cacheRef.current;
    if (cache.size <= maxCachedPages) return;
    const toRemove = cache.size - maxCachedPages;
    let i = 0;
    for (const k of cache.keys()) {
      cache.delete(k);
      i += 1;
      if (i >= toRemove) break;
    }
  }, [maxCachedPages]);

  const prefetchNext = useCallback(
    async (base: CiDataTableCursorQuery, nextCursor: string) => {
      if (!source) return;
      const q: CiDataTableCursorQuery = { ...base, cursor: nextCursor };
      const key = makeCacheKey(q);
      if (cacheRef.current.has(key)) return;
      try {
        const res = await source.fetchPage(q);
        cacheRef.current.set(key, res);
        trimCacheIfNeeded();
      } catch {
        // ignore prefetch failures
      }
    },
    [source, makeCacheKey, trimCacheIfNeeded],
  );

  const fetchAndSetPage = useCallback(
    async (q: CiDataTableCursorQuery) => {
      if (!source) return;

      const key = makeCacheKey(q);

      if (effectiveMode === "hybrid") {
        const cached = cacheRef.current.get(key);
        if (cached) {
          setPage(cached);
          setErrMsg(null);

          if (prefetchNextPage && cached.nextCursor) {
            void prefetchNext(q, cached.nextCursor);
          }
          return;
        }
      }

      setIsLoading(true);
      setErrMsg(null);

      try {
        const res = await source.fetchPage(q);
        setPage(res);

        if (effectiveMode === "hybrid") {
          cacheRef.current.set(key, res);
          trimCacheIfNeeded();
        }

        if (prefetchNextPage && res.nextCursor) {
          void prefetchNext(q, res.nextCursor);
        }
      } catch (e: unknown) {
        setErrMsg(e instanceof Error ? e.message : "Failed to load data.");
      } finally {
        setIsLoading(false);
      }
    },
    [
      source,
      effectiveMode,
      makeCacheKey,
      trimCacheIfNeeded,
      prefetchNextPage,
      prefetchNext,
    ],
  );

  // Fetch on changes (server/hybrid)
  useEffect(() => {
    if (effectiveMode === "client") return;
    if (!source) return;

    const q: CiDataTableCursorQuery = {
      search: debouncedSearch || undefined,
      sort: sortSpec.length ? sortSpec : undefined,
      pageSize,
      cursor,
    };

    void fetchAndSetPage(q);
  }, [
    effectiveMode,
    source,
    debouncedSearch,
    JSON.stringify(sortSpec),
    pageSize,
    cursor,
    fetchAndSetPage,
  ]);

  const canPrev =
    effectiveMode !== "client" && cursorStack.length > 1 && !isLoading;
  const canNext = effectiveMode !== "client" && !!page.nextCursor && !isLoading;

  const onPrev = () => {
    if (!canPrev) return;
    setCursorStack((prev) => {
      const next = prev.slice(0, -1);
      const prevCursor = next[next.length - 1] ?? null;
      setCursor(prevCursor);
      return next;
    });
  };

  const onNext = () => {
    if (!canNext) return;
    const nextCursor = page.nextCursor ?? null;
    setCursorStack((prev) => [...prev, nextCursor]);
    setCursor(nextCursor);
  };

  const alignCell = "text-left rtl:text-right";
  const alignHead = "text-left rtl:text-right";
  const alignToolbarButtons = "ml-auto rtl:ml-0 rtl:mr-auto";

  return (
    <div
      dir={direction}
      className={["w-full", className].filter(Boolean).join(" ")}
    >
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h2 className="text-xl leading-none font-semibold">{title}</h2>
          )}
          {description && (
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          )}
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="w-full max-w-md">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>

        {effectiveMode !== "client" && (
          <div
            className={[alignToolbarButtons, "flex items-center gap-2"].join(
              " ",
            )}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onPrev}
              disabled={!canPrev}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onNext}
              disabled={!canNext}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {errMsg ? (
        <div className="border-destructive/40 bg-destructive/5 mb-3 rounded-md border p-3 text-sm">
          {errMsg}
        </div>
      ) : null}

      <div className="bg-background rounded-xl border">
        <div className="w-full overflow-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => {
                    const canSort = h.column.getCanSort();
                    const sortDir = h.column.getIsSorted();

                    return (
                      <TableHead
                        key={h.id}
                        className={["whitespace-nowrap", alignHead].join(" ")}
                      >
                        {h.isPlaceholder ? null : (
                          <button
                            type="button"
                            className={[
                              "inline-flex items-center gap-2",
                              alignHead, // ensures header button aligns the same way
                              canSort
                                ? "cursor-pointer select-none"
                                : "cursor-default",
                            ].join(" ")}
                            onClick={
                              canSort
                                ? h.column.getToggleSortingHandler()
                                : undefined
                            }
                          >
                            {flexRender(
                              h.column.columnDef.header,
                              h.getContext(),
                            )}
                            {canSort && (
                              <span className="text-muted-foreground">
                                {sortDir === "asc"
                                  ? "▲"
                                  : sortDir === "desc"
                                  ? "▼"
                                  : "↕"}
                              </span>
                            )}
                          </button>
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {isLoading && effectiveMode !== "client" ? (
                <TableRow>
                  <TableCell
                    colSpan={columnsWithActions.length}
                    className="text-muted-foreground h-24 text-center text-sm"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/50">
                    {r.getVisibleCells().map((c) => (
                      <TableCell
                        key={c.id}
                        className={["whitespace-nowrap", alignCell].join(" ")}
                      >
                        {flexRender(c.column.columnDef.cell, c.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columnsWithActions.length}
                    className="text-muted-foreground h-24 text-center text-sm"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// function RowActions<TData>({ row, actions }: { row: TData; actions: DataTableAction<TData>[] }) {
//   const visible = actions.filter((a) => (a.isVisible ? a.isVisible(row) : true));
//   if (!visible.length) return null;

//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger asChild>
//         <Button variant='ghost' size='sm' className='h-8 px-2'>
//           ⋯
//         </Button>
//       </DropdownMenuTrigger>

//       <DropdownMenuContent align='end' className='min-w-[180px]'>
//         {visible.map((a, idx) => {
//           const disabled = a.isDisabled ? a.isDisabled(row) : false;
//           const isDestructive = a.variant === 'destructive';

//           const shouldSeparate = isDestructive && idx > 0;

//           return (
//             <React.Fragment key={a.id}>
//               {shouldSeparate ? <DropdownMenuSeparator /> : null}
//               <DropdownMenuItem
//                 disabled={disabled}
//                 onClick={async () => {
//                   if (disabled) return;
//                   await a.onSelect(row);
//                 }}
//                 className={isDestructive ? 'text-destructive focus:text-destructive' : undefined}
//               >
//                 {a.icon ? <span className='mr-2 inline-flex'>{a.icon}</span> : null}
//                 {a.label}
//               </DropdownMenuItem>
//             </React.Fragment>
//           );
//         })}
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );
// }
