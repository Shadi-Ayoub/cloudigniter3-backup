"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  flexRender,
  useTable,
  type Cell,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnSizingState,
  type OnChangeFn,
  type PaginationState,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from "@tanstack/react-table";
import { ciDataTableFeatures, type CiDataTableFeatures } from "@ci-ui/common";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  Button,
  Checkbox,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from "@ci-ui/client";
import type {
  CiDataTableCellContext,
  CiDataTableColumnDef,
  CiDataTableColumnMeta,
  CiDataTableExcelColumn,
  CiDataTableFilterSpec,
  CiDataTableFilterValue,
  CiDataTableFormat,
  CiDataTableFormatOption,
  CiDataTableGlobalActionContext,
  CiDataTableInterface,
  CiDataTablePage,
  CiDataTablePageCache,
  CiDataTablePageSize,
  CiDataTablePreferences,
  CiDataTableQuery,
} from "@ci-ui/types";

import {
  ciExportDataTableToExcel,
  ciLoadDataTablePreferences,
  ciSaveDataTablePreferences,
} from "../lib";
import { CiDataTableRowActions } from "./CiDataTableRowActions";

const ACTIONS_COLUMN_ID = "__ci_actions__";
const SELECTION_COLUMN_ID = "__ci_selection__";
const FILTER_ALL_VALUE = "__ci_all__";
const DEFAULT_PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_LABELS = {
  search: "Search...",
  loading: "Loading...",
  noResults: "No results.",
  actions: "Actions",
  selected: "selected",
  previousPage: "Previous page",
  nextPage: "Next page",
  page: "Page",
  rowsPerPage: "Rows per page",
  allRows: "All",
  viewFormat: "View format",
  exportExcel: "Export Excel",
  selectAll: "Select all rows on this page",
  selectRow: "Select row",
} as const;

/** Returns a debounced state value for provider queries and global filtering. */
function useDebouncedValue<TValue>(value: TValue, delayMs: number): TValue {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [delayMs, value]);
  return debounced;
}

/** Resolves either a value or a functional state updater. */
function applyUpdater<TValue>(updater: Updater<TValue>, value: TValue): TValue {
  return typeof updater === "function"
    ? (updater as (current: TValue) => TValue)(value)
    : updater;
}

/** Encodes typed select values without losing number or boolean identity. */
function encodeFilterValue(value: CiDataTableFilterValue): string {
  return JSON.stringify(value);
}

/** Decodes a typed select value produced by encodeFilterValue. */
function decodeFilterValue(value: string): CiDataTableFilterValue {
  try {
    return JSON.parse(value) as CiDataTableFilterValue;
  } catch {
    return value;
  }
}

/** Reads a nested accessor path from a row for the default Excel export. */
function getValueAtPath(row: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[key];
  }, row);
}

/** Returns CloudIgniter metadata attached to a TanStack column. */
function getColumnMeta<TData extends RowData>(
  column: ColumnDef<CiDataTableFeatures, TData, unknown>
): CiDataTableColumnMeta<TData, unknown> | undefined {
  return (
    column.meta as
      | { ciDataTable?: CiDataTableColumnMeta<TData, unknown> }
      | undefined
  )?.ciDataTable;
}

/** Resolves a stable identifier for accessor and display columns. */
function getColumnId<TData extends RowData>(
  column: ColumnDef<CiDataTableFeatures, TData, unknown>
): string | undefined {
  if (column.id) return column.id;
  const accessorKey = (column as { accessorKey?: string }).accessorKey;
  return accessorKey?.replaceAll(".", "_");
}

/** Converts component column definitions into serializable Excel columns. */
function buildExcelColumns<TData extends RowData>(
  columns: ColumnDef<CiDataTableFeatures, TData, unknown>[]
): CiDataTableExcelColumn<TData>[] {
  return columns.flatMap((column) => {
    const meta = getColumnMeta(column);
    if (meta?.export === false) return [];
    const exportConfig =
      meta?.export && typeof meta.export === "object" ? meta.export : undefined;
    const id = getColumnId(column);
    const accessorKey = (column as { accessorKey?: string }).accessorKey;
    const accessorFn = (
      column as { accessorFn?: (row: TData, index: number) => unknown }
    ).accessorFn;
    if (!id || (!exportConfig?.value && !accessorKey && !accessorFn)) return [];
    const header =
      exportConfig?.header ??
      meta?.label ??
      (typeof column.header === "string" ? column.header : id);

    return [
      {
        id,
        header,
        value: (row: TData) =>
          exportConfig?.value
            ? exportConfig.value(row)
            : accessorKey
            ? getValueAtPath(row, accessorKey)
            : accessorFn?.(row, 0),
        width: column.size ? Math.round(column.size / 7) : undefined,
      },
    ];
  });
}

/** Renders a configurable, provider-ready object management table. */
export function CiDataTable<TData extends RowData, TValue = unknown>({
  title,
  description,
  definition,
  columns: legacyColumns,
  data = [],
  source,
  rowActions: legacyRowActions,
  searchPlaceholder,
  className,
  config,
  direction,
  loading: externalLoading = false,
  error: externalError,
  emptyState,
  onQueryChange,
  onSelectionChange,
}: CiDataTableInterface<TData, TValue>) {
  const labels = { ...DEFAULT_LABELS, ...config?.labels };
  const baseColumns = useMemo(
    () =>
      (definition?.columns ?? legacyColumns ?? []) as CiDataTableColumnDef<
        TData,
        unknown
      >[] as ColumnDef<CiDataTableFeatures, TData, unknown>[],
    [definition?.columns, legacyColumns]
  );
  const rowActions = definition?.rowActions ?? legacyRowActions ?? [];
  const information = definition?.information;
  const globalActions = definition?.globalActions ?? [];
  const filters = definition?.filters ?? [];
  const formats: CiDataTableFormatOption[] = config?.formats?.length
    ? config.formats
    : [{ id: "table", label: "Table" }];
  const defaultFormat = config?.defaultFormat ?? formats[0]?.id ?? "table";
  const configuredPageSize =
    config?.pagination?.pageSize ?? config?.pageSize ?? 25;
  const pageSizeOptions =
    config?.pagination?.pageSizeOptions ??
    config?.pageSizeOptions ??
    DEFAULT_PAGE_SIZES;
  const debounceMs = config?.filtering?.debounceMs ?? config?.debounceMs ?? 250;
  const paginationEnabled = config?.pagination?.enabled !== false;
  const globalFilterEnabled = config?.filtering?.global !== false;
  const columnResizing = config?.columnResizing ?? true;
  const hoverHighlight = config?.hoverHighlight ?? true;
  const stripedRows = config?.stripedRows ?? true;
  const rowActionMode = config?.rowActions?.mode ?? "menu";
  const rowActionInlineCount = Math.max(
    0,
    config?.rowActions?.inlineCount ?? 2
  );
  const selectionEnabled =
    config?.selection?.enabled ??
    globalActions.some((action) => (action.selection ?? "required") !== "none");
  const effectiveMode =
    config?.mode === "client" || !source
      ? "client"
      : config?.mode === "server"
      ? "server"
      : "hybrid";
  const isProviderMode = effectiveMode !== "client";

  const initialFilters = useMemo<ColumnFiltersState>(
    () =>
      filters.flatMap((filter) =>
        filter.defaultValue === undefined || filter.defaultValue === null
          ? []
          : [{ id: filter.id, value: filter.defaultValue }]
      ),
    [filters]
  );
  const [sorting, setSorting] = useState<SortingState>(
    config?.sorting?.initial ?? []
  );
  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>(initialFilters);
  const [globalFilter, setGlobalFilter] = useState("");
  const debouncedGlobalFilter = useDebouncedValue(globalFilter, debounceMs);
  const [format, setFormat] = useState<CiDataTableFormat>(defaultFormat);
  const [pageSizeChoice, setPageSizeChoice] =
    useState<CiDataTablePageSize>(configuredPageSize);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: configuredPageSize,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([null]);
  const [providerPage, setProviderPage] = useState<CiDataTablePage<TData>>({
    rows: [],
  });
  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [refreshSequence, setRefreshSequence] = useState(0);
  const [busyActions, setBusyActions] = useState<Set<string>>(new Set());
  const cacheRef = useRef<CiDataTablePageCache<TData>>(new Map());
  const preferencesLoadedRef = useRef(false);

  const normalizedFilters = useMemo<CiDataTableFilterSpec[]>(
    () =>
      columnFilters.map((filter) => ({
        id: filter.id,
        value: filter.value as CiDataTableFilterValue,
      })),
    [columnFilters]
  );
  const query = useMemo<CiDataTableQuery>(
    () => ({
      globalFilter: debouncedGlobalFilter || undefined,
      search: debouncedGlobalFilter || undefined,
      filters: normalizedFilters,
      sorting: sorting.map((sort) => ({ id: sort.id, desc: sort.desc })),
      sort: sorting.map((sort) => ({ id: sort.id, desc: sort.desc })),
      pageIndex: pagination.pageIndex,
      pageSize: pageSizeChoice,
      cursor,
      format,
    }),
    [
      cursor,
      debouncedGlobalFilter,
      format,
      normalizedFilters,
      pageSizeChoice,
      pagination.pageIndex,
      sorting,
    ]
  );

  /** Resets cursor and page-number navigation after criteria changes. */
  const resetPaging = useCallback(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
    setCursor(null);
    setCursorStack([null]);
  }, []);

  /** Invalidates provider caches and refetches the active query. */
  const refresh = useCallback(() => {
    cacheRef.current.clear();
    setRefreshSequence((current) => current + 1);
  }, []);

  const handleSortingChange: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      setSorting((current) => applyUpdater(updater, current));
      resetPaging();
    },
    [resetPaging]
  );
  const handleColumnFiltersChange: OnChangeFn<ColumnFiltersState> = useCallback(
    (updater) => {
      setColumnFilters((current) => applyUpdater(updater, current));
      resetPaging();
    },
    [resetPaging]
  );
  const handleGlobalFilterChange = useCallback(
    (value: string) => {
      setGlobalFilter(value);
      resetPaging();
    },
    [resetPaging]
  );

  const filteredBaseColumns = useMemo(() => {
    const filterMap = new Map(filters.map((filter) => [filter.id, filter]));
    return baseColumns.map((column) => {
      const id = getColumnId(column);
      const filter = id ? filterMap.get(id) : undefined;
      const metaFilter = getColumnMeta(column)?.filter;
      if (!filter && !metaFilter) return column;
      return {
        ...column,
        filterFn:
          filter?.filterFn ??
          ((filter?.type ?? metaFilter?.type) === "text"
            ? "includesString"
            : "equals"),
      } as ColumnDef<CiDataTableFeatures, TData, unknown>;
    });
  }, [baseColumns, filters]);

  const columns = useMemo<
    ColumnDef<CiDataTableFeatures, TData, unknown>[]
  >(() => {
    const leadingColumns: ColumnDef<CiDataTableFeatures, TData, unknown>[] = [];
    const trailingColumns: ColumnDef<CiDataTableFeatures, TData, unknown>[] =
      [];

    if (rowActions.length || information) {
      const menuWidth = information ? (rowActions.length ? 128 : 72) : 64;
      const buttonWidth = information ? 240 : 180;
      trailingColumns.push({
        id: ACTIONS_COLUMN_ID,
        header: config?.rowActions?.header ?? labels.actions,
        size: rowActionMode === "menu" ? menuWidth : buttonWidth,
        minSize: rowActionMode === "menu" ? menuWidth : 100,
        maxSize: 320,
        enableSorting: false,
        enableColumnFilter: false,
        enableResizing: false,
        cell: ({ row }) => (
          <CiDataTableRowActions
            row={row.original}
            actions={rowActions}
            information={information}
            context={{ row: row.original, query, refresh }}
            mode={rowActionMode}
            inlineCount={rowActionInlineCount}
            menuLabel={labels.actions}
          />
        ),
      });
    }

    if (selectionEnabled) {
      leadingColumns.push({
        id: SELECTION_COLUMN_ID,
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
            }
            onCheckedChange={(checked) =>
              table.toggleAllPageRowsSelected(Boolean(checked))
            }
            aria-label={labels.selectAll}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
            aria-label={labels.selectRow}
          />
        ),
        size: 44,
        minSize: 44,
        maxSize: 44,
        enableSorting: false,
        enableColumnFilter: false,
        enableResizing: false,
      });
    }

    // Selection stays at inline-start; row actions sit at inline-end in both LTR and RTL.
    return [...leadingColumns, ...filteredBaseColumns, ...trailingColumns];
  }, [
    config?.rowActions?.header,
    filteredBaseColumns,
    labels.actions,
    labels.selectAll,
    labels.selectRow,
    information,
    query,
    refresh,
    rowActionInlineCount,
    rowActionMode,
    rowActions,
    selectionEnabled,
  ]);

  useEffect(() => {
    onQueryChange?.(query);
  }, [onQueryChange, query]);

  useEffect(() => {
    if (!isProviderMode || !source) return;
    const controller = new AbortController();
    const cacheKey = `${
      config?.cacheKey ?? "default"
    }:${refreshSequence}:${JSON.stringify(query)}`;
    const cached =
      effectiveMode === "hybrid" ? cacheRef.current.get(cacheKey) : undefined;

    if (cached) {
      setProviderPage(cached);
      setLocalError(null);
      return;
    }

    setIsRequestLoading(true);
    setLocalError(null);
    void source
      .fetchPage(query, controller.signal)
      .then((page) => {
        if (controller.signal.aborted) return;
        setProviderPage(page);
        if (effectiveMode === "hybrid") {
          cacheRef.current.set(cacheKey, page);
          const maxPages = Math.max(1, config?.maxCachedPages ?? 5);
          while (cacheRef.current.size > maxPages) {
            const oldest = cacheRef.current.keys().next().value as
              | string
              | undefined;
            if (!oldest) break;
            cacheRef.current.delete(oldest);
          }
        }

        if (config?.prefetchNextPage && page.nextCursor) {
          const nextQuery = {
            ...query,
            pageIndex: query.pageIndex + 1,
            cursor: page.nextCursor,
          };
          const nextKey = `${
            config.cacheKey ?? "default"
          }:${refreshSequence}:${JSON.stringify(nextQuery)}`;
          if (!cacheRef.current.has(nextKey)) {
            void source
              .fetchPage(nextQuery)
              .then((nextPage) => {
                cacheRef.current.set(nextKey, nextPage);
              })
              .catch(() => {
                // Prefetch is opportunistic; the active-page request reports errors.
              });
          }
        }
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setLocalError(
          cause instanceof Error ? cause.message : "Failed to load data."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsRequestLoading(false);
      });

    return () => controller.abort();
  }, [
    config?.cacheKey,
    config?.maxCachedPages,
    config?.prefetchNextPage,
    effectiveMode,
    isProviderMode,
    query,
    refreshSequence,
    source,
  ]);

  const tableData = isProviderMode ? providerPage.rows : data;
  const tanStackPageSize =
    pageSizeChoice === "all" ? Number.MAX_SAFE_INTEGER : pageSizeChoice;

  useEffect(() => {
    setPagination((current) => ({
      ...current,
      pageSize: tanStackPageSize,
    }));
  }, [tanStackPageSize]);

  const table = useTable({
    features: ciDataTableFeatures,
    data: tableData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter: debouncedGlobalFilter,
      pagination,
      rowSelection,
      columnSizing,
    },
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    manualFiltering: isProviderMode,
    manualSorting: isProviderMode,
    manualPagination: isProviderMode,
    enableSorting: config?.sorting?.enabled !== false,
    enableColumnResizing: columnResizing,
    columnResizeMode: "onChange",
    enableRowSelection: (row) =>
      selectionEnabled &&
      (config?.selection?.enableRow?.(row.original) ?? true),
    getRowId: definition?.getRowId,
    rowCount: providerPage.totalRowCount,
  });

  const selectedRows = table
    .getSelectedRowModel()
    .flatRows.map((row) => row.original);

  useEffect(() => {
    onSelectionChange?.(selectedRows);
  }, [onSelectionChange, rowSelection, tableData]);

  useEffect(() => {
    const persistence = config?.persistence;
    if (!persistence) {
      preferencesLoadedRef.current = true;
      return;
    }
    const preferences = ciLoadDataTablePreferences(persistence);
    if (preferences?.columnWidths && persistence.columnWidths !== false) {
      setColumnSizing(preferences.columnWidths);
    }
    if (preferences?.filters && persistence.filters !== false) {
      setColumnFilters(
        preferences.filters.map((filter) => ({
          id: filter.id,
          value: filter.value,
        }))
      );
      setGlobalFilter(preferences.globalFilter ?? "");
    }
    if (preferences?.pageSize && persistence.pageSize !== false) {
      setPageSizeChoice(preferences.pageSize);
    }
    if (
      preferences?.format &&
      persistence.format !== false &&
      formats.some((option) => option.id === preferences.format)
    ) {
      setFormat(preferences.format);
    }
    preferencesLoadedRef.current = true;
  }, [
    config?.persistence?.columnWidths,
    config?.persistence?.cookieName,
    config?.persistence?.filters,
    config?.persistence?.format,
    config?.persistence?.key,
    config?.persistence?.maxAgeDays,
    config?.persistence?.pageSize,
  ]);

  useEffect(() => {
    const persistence = config?.persistence;
    if (!persistence || !preferencesLoadedRef.current) return;
    const preferences: CiDataTablePreferences = {};
    if (persistence.columnWidths !== false) {
      preferences.columnWidths = columnSizing;
    }
    if (persistence.filters !== false) {
      preferences.filters = normalizedFilters;
      preferences.globalFilter = globalFilter;
    }
    if (persistence.pageSize !== false) {
      preferences.pageSize = pageSizeChoice;
    }
    if (persistence.format !== false) preferences.format = format;

    const timeout = window.setTimeout(
      () => ciSaveDataTablePreferences(persistence, preferences),
      150
    );
    return () => window.clearTimeout(timeout);
  }, [
    columnSizing,
    config?.persistence,
    format,
    globalFilter,
    normalizedFilters,
    pageSizeChoice,
  ]);

  /** Exports selected, displayed, or all filtered rows according to config. */
  const exportExcel = useCallback(async () => {
    const excelConfig =
      typeof config?.excelExport === "object" ? config.excelExport : {};
    const scope = excelConfig.scope ?? "all-filtered";
    let rows: TData[];

    if (scope === "selected") {
      rows = selectedRows;
    } else if (scope === "current-page") {
      rows = table.getRowModel().rows.map((row) => row.original);
    } else if (isProviderMode && source?.fetchAll) {
      const {
        cursor: _cursor,
        pageIndex: _pageIndex,
        pageSize: _pageSize,
        ...allQuery
      } = query;
      rows = await source.fetchAll(allQuery);
    } else if (isProviderMode) {
      rows = providerPage.rows;
    } else {
      rows = table.getPrePaginatedRowModel().rows.map((row) => row.original);
    }

    await ciExportDataTableToExcel({
      rows,
      columns: buildExcelColumns(baseColumns),
      fileName:
        excelConfig.fileName ??
        `${(title ?? "table").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.xlsx`,
      sheetName: excelConfig.sheetName ?? title ?? "Data",
    });
  }, [
    baseColumns,
    config?.excelExport,
    isProviderMode,
    providerPage.rows,
    query,
    selectedRows,
    source,
    table,
    title,
  ]);

  const globalActionContext: CiDataTableGlobalActionContext<TData> = {
    selectedRows,
    query,
    clearSelection: () => setRowSelection({}),
    refresh,
    exportExcel,
  };

  /** Runs a global action while disabling only that action's button. */
  const runGlobalAction = useCallback(
    async (actionId: string, callback: () => void | Promise<void>) => {
      setBusyActions((current) => new Set(current).add(actionId));
      setLocalError(null);
      try {
        await callback();
      } catch (cause: unknown) {
        setLocalError(
          cause instanceof Error ? cause.message : "The table action failed."
        );
      } finally {
        setBusyActions((current) => {
          const next = new Set(current);
          next.delete(actionId);
          return next;
        });
      }
    },
    []
  );

  /** Updates one toolbar filter and removes it when All is selected. */
  const setToolbarFilter = useCallback(
    (id: string, value: CiDataTableFilterValue | undefined) => {
      handleColumnFiltersChange((current) => {
        const remaining = current.filter((filter) => filter.id !== id);
        return value === undefined || value === null || value === ""
          ? remaining
          : [...remaining, { id, value }];
      });
    },
    [handleColumnFiltersChange]
  );

  const handlePageSizeChange = useCallback(
    (value: string) => {
      const pageSize: CiDataTablePageSize =
        value === "all" ? "all" : Number(value);
      setPageSizeChoice(pageSize);
      setRowSelection({});
      resetPaging();
    },
    [resetPaging]
  );

  const canPreviousPage = pagination.pageIndex > 0;
  const numericPageSize =
    pageSizeChoice === "all" ? tableData.length : pageSizeChoice;
  const canNextProviderPage =
    pageSizeChoice !== "all" &&
    (Boolean(providerPage.nextCursor) ||
      (providerPage.totalRowCount !== undefined
        ? (pagination.pageIndex + 1) * numericPageSize <
          providerPage.totalRowCount
        : providerPage.rows.length >= numericPageSize));
  const canNextPage = isProviderMode
    ? canNextProviderPage
    : table.getCanNextPage();

  /** Moves to the prior client page or prior cursor-stack entry. */
  const goToPreviousPage = useCallback(() => {
    if (!canPreviousPage) return;
    if (!isProviderMode) {
      setPagination((current) => ({
        ...current,
        pageIndex: Math.max(0, current.pageIndex - 1),
      }));
      return;
    }
    const nextIndex = Math.max(0, pagination.pageIndex - 1);
    setPagination((current) => ({ ...current, pageIndex: nextIndex }));
    setCursor(cursorStack[nextIndex] ?? null);
    setRowSelection({});
  }, [canPreviousPage, cursorStack, isProviderMode, pagination.pageIndex]);

  /** Moves to the next client page or provider cursor. */
  const goToNextPage = useCallback(() => {
    if (!canNextPage) return;
    if (!isProviderMode) {
      setPagination((current) => ({
        ...current,
        pageIndex: current.pageIndex + 1,
      }));
      return;
    }
    const nextCursor = providerPage.nextCursor ?? null;
    const nextIndex = pagination.pageIndex + 1;
    setCursorStack((current) => {
      const next = current.slice(0, nextIndex);
      next[nextIndex] = nextCursor;
      return next;
    });
    setCursor(nextCursor);
    setPagination((current) => ({ ...current, pageIndex: nextIndex }));
    setRowSelection({});
  }, [
    canNextPage,
    isProviderMode,
    pagination.pageIndex,
    providerPage.nextCursor,
  ]);

  const totalPages = isProviderMode
    ? providerPage.totalRowCount === undefined || pageSizeChoice === "all"
      ? undefined
      : Math.max(1, Math.ceil(providerPage.totalRowCount / numericPageSize))
    : Math.max(1, table.getPageCount());
  const isLoading = externalLoading || isRequestLoading;
  const resolvedError = externalError ?? localError;
  const widthStyle =
    typeof config?.width === "number"
      ? `${config.width}px`
      : config?.width ?? "100%";

  /** Computes a fluid percentage from TanStack's resizable column sizes. */
  const getCellStyle = useCallback(
    (cellOrHeader: { column: { getSize: () => number } }) => ({
      width: `${(cellOrHeader.column.getSize() / table.getTotalSize()) * 100}%`,
      flex: "0 0 auto",
    }),
    [table]
  );

  /** Renders a cell with conditional styling, truncation, and navigation. */
  const renderCell = useCallback(
    (cell: Cell<CiDataTableFeatures, TData, unknown>) => {
      const meta = getColumnMeta(cell.column.columnDef);
      const value = cell.getValue();
      const context: CiDataTableCellContext<TData, unknown> = {
        row: cell.row.original,
        value,
        columnId: cell.column.id,
      };
      const content = flexRender(cell.column.columnDef.cell, cell.getContext());
      const truncate = meta?.truncate;
      const maxWidth =
        typeof truncate === "number"
          ? truncate
          : typeof truncate === "object"
          ? truncate.maxWidth
          : undefined;
      const showTitle =
        truncate === true ||
        typeof truncate === "number" ||
        (typeof truncate === "object" && truncate.showTitle !== false);
      const wrapped = (
        <div
          className={cn(
            truncate && "overflow-hidden text-ellipsis whitespace-nowrap"
          )}
          style={maxWidth ? { maxWidth } : undefined}
          title={showTitle && value != null ? String(value) : undefined}
        >
          {content}
        </div>
      );

      if (meta?.clickable?.href) {
        return (
          <a
            href={meta.clickable.href(context)}
            className="focus-visible:ring-ring block rounded-sm text-start outline-none focus-visible:ring-2"
            aria-label={meta.clickable.ariaLabel?.(context)}
          >
            {wrapped}
          </a>
        );
      }
      if (meta?.clickable?.onClick) {
        return (
          <button
            type="button"
            className="focus-visible:ring-ring block w-full rounded-sm text-start outline-none focus-visible:ring-2"
            aria-label={meta.clickable.ariaLabel?.(context)}
            onClick={() => meta.clickable?.onClick?.(context)}
          >
            {wrapped}
          </button>
        );
      }
      return wrapped;
    },
    []
  );

  /** Resolves a cell's conditionally computed class name. */
  const getCellClassName = useCallback(
    (cell: Cell<CiDataTableFeatures, TData, unknown>) => {
      const meta = getColumnMeta(cell.column.columnDef);
      if (!meta?.className || typeof meta.className === "string") {
        return meta?.className;
      }
      return meta.className({
        row: cell.row.original,
        value: cell.getValue(),
        columnId: cell.column.id,
      });
    },
    []
  );

  const visibleRows = table.getRowModel().rows;

  /** Renders table and compact formats with shared semantic markup. */
  const renderTableFormat = (compact: boolean) => (
    <div className="bg-background overflow-hidden rounded-xl border">
      <Table className="w-full table-fixed">
        <TableHeader className="bg-muted/70">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="flex hover:bg-transparent"
            >
              {headerGroup.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                const meta = getColumnMeta(header.column.columnDef);
                const headerFilter = meta?.filter;
                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "relative h-auto min-w-0 px-3 py-2 text-start align-middle font-semibold text-foreground",
                      header.column.id === ACTIONS_COLUMN_ID && "text-end",
                      meta?.headerClassName
                    )}
                    style={getCellStyle(header)}
                    aria-sort={
                      sorted === "asc"
                        ? "ascending"
                        : sorted === "desc"
                        ? "descending"
                        : "none"
                    }
                  >
                    <div className="flex min-w-0 flex-col gap-2">
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          className="focus-visible:ring-ring inline-flex min-w-0 items-center gap-1 rounded-sm text-start outline-none focus-visible:ring-2"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span className="truncate">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </span>
                          <span
                            aria-hidden
                            className="text-muted-foreground text-xs"
                          >
                            {sorted === "asc"
                              ? "▲"
                              : sorted === "desc"
                              ? "▼"
                              : "↕"}
                          </span>
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                      {headerFilter ? (
                        headerFilter.type === "select" ? (
                          <Select
                            value={
                              header.column.getFilterValue() === undefined
                                ? FILTER_ALL_VALUE
                                : encodeFilterValue(
                                    header.column.getFilterValue() as CiDataTableFilterValue
                                  )
                            }
                            onValueChange={(value) =>
                              header.column.setFilterValue(
                                value === FILTER_ALL_VALUE
                                  ? undefined
                                  : decodeFilterValue(value)
                              )
                            }
                          >
                            <SelectTrigger
                              size="sm"
                              className="bg-background w-full font-normal"
                              aria-label={
                                headerFilter.placeholder ?? header.column.id
                              }
                            >
                              <SelectValue
                                placeholder={headerFilter.placeholder ?? "All"}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={FILTER_ALL_VALUE}>
                                {labels.allRows}
                              </SelectItem>
                              {headerFilter.options?.map((option) => (
                                <SelectItem
                                  key={`${option.id}`}
                                  value={encodeFilterValue(option.id)}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={String(header.column.getFilterValue() ?? "")}
                            onChange={(event) =>
                              header.column.setFilterValue(
                                event.target.value || undefined
                              )
                            }
                            placeholder={
                              headerFilter.placeholder ?? "Filter..."
                            }
                            className="bg-background h-8 font-normal"
                            aria-label={
                              headerFilter.placeholder ?? header.column.id
                            }
                          />
                        )
                      ) : null}
                    </div>
                    {header.column.getCanResize() ? (
                      <div
                        role="separator"
                        aria-label={`Resize ${header.column.id} column`}
                        aria-orientation="vertical"
                        onDoubleClick={() => header.column.resetSize()}
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={cn(
                          "absolute inset-y-0 end-0 z-10 w-1 cursor-col-resize touch-none select-none",
                          header.column.getIsResizing()
                            ? "bg-primary"
                            : "hover:bg-border"
                        )}
                      />
                    ) : null}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-muted-foreground h-28 w-full text-center"
              >
                <RefreshCw
                  className="me-2 inline size-4 animate-spin"
                  aria-hidden
                />
                {labels.loading}
              </TableCell>
            </TableRow>
          ) : visibleRows.length ? (
            visibleRows.map((row, rowIndex) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? "selected" : undefined}
                className={cn(
                  "flex",
                  stripedRows && rowIndex % 2 === 0
                    ? "bg-muted/25"
                    : "bg-background",
                  hoverHighlight ? "hover:bg-accent/60" : "hover:bg-inherit"
                )}
              >
                {row.getAllCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      "min-w-0 text-start align-middle",
                      compact ? "px-2 py-1.5" : "px-3 py-2.5",
                      cell.column.id === ACTIONS_COLUMN_ID && "text-end",
                      getCellClassName(cell)
                    )}
                    style={getCellStyle(cell)}
                  >
                    {renderCell(cell)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-muted-foreground h-28 w-full text-center"
              >
                {emptyState ?? labels.noResults}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  /** Renders responsive cards using the same TanStack rows and cell renderers. */
  const renderCardsFormat = () => (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {isLoading ? (
        <div className="text-muted-foreground col-span-full rounded-xl border p-8 text-center">
          <RefreshCw className="me-2 inline size-4 animate-spin" aria-hidden />
          {labels.loading}
        </div>
      ) : visibleRows.length ? (
        visibleRows.map((row, rowIndex) => {
          const actionCell = row
            .getAllCells()
            .find((cell) => cell.column.id === ACTIONS_COLUMN_ID);
          const selectionCell = row
            .getAllCells()
            .find((cell) => cell.column.id === SELECTION_COLUMN_ID);
          const dataCells = row
            .getAllCells()
            .filter(
              (cell) =>
                cell.column.id !== ACTIONS_COLUMN_ID &&
                cell.column.id !== SELECTION_COLUMN_ID
            );
          return (
            <article
              key={row.id}
              data-state={row.getIsSelected() ? "selected" : undefined}
              className={cn(
                "rounded-xl border p-4 transition-colors data-[state=selected]:bg-muted",
                stripedRows && rowIndex % 2 === 0
                  ? "bg-muted/25"
                  : "bg-background",
                hoverHighlight && "hover:bg-accent/60"
              )}
            >
              {selectionCell ? (
                <div className="mb-3">{renderCell(selectionCell)}</div>
              ) : null}
              <dl className="space-y-3">
                {dataCells.map((cell) => {
                  const meta = getColumnMeta(cell.column.columnDef);
                  return (
                    <div
                      key={cell.id}
                      className="grid grid-cols-[minmax(6rem,0.4fr)_1fr] gap-3"
                    >
                      <dt className="text-muted-foreground text-sm font-medium">
                        {meta?.label ??
                          (typeof cell.column.columnDef.header === "string"
                            ? cell.column.columnDef.header
                            : cell.column.id)}
                      </dt>
                      <dd
                        className={cn(
                          "min-w-0 text-sm",
                          getCellClassName(cell)
                        )}
                      >
                        {renderCell(cell)}
                      </dd>
                    </div>
                  );
                })}
              </dl>
              {actionCell ? (
                <div className="mt-4 flex justify-end border-t pt-3">
                  {renderCell(actionCell)}
                </div>
              ) : null}
            </article>
          );
        })
      ) : (
        <div className="text-muted-foreground col-span-full rounded-xl border p-8 text-center">
          {emptyState ?? labels.noResults}
        </div>
      )}
    </div>
  );

  const showExport =
    config?.excelExport !== false &&
    (typeof config?.excelExport !== "object" ||
      config.excelExport.enabled !== false);

  return (
    <section
      dir={direction}
      className={cn("flex max-w-full flex-col", className)}
      style={{ width: widthStyle }}
      aria-busy={isLoading}
    >
      {(title || description) && (
        <header className="mb-4">
          {title ? (
            <h2 className="text-xl font-semibold leading-none">{title}</h2>
          ) : null}
          {description ? (
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          ) : null}
        </header>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {globalFilterEnabled ? (
          <label className="relative min-w-56 flex-1 sm:max-w-sm">
            <Search
              className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2"
              aria-hidden
            />
            <span className="sr-only">{labels.search}</span>
            <Input
              value={globalFilter}
              onChange={(event) => handleGlobalFilterChange(event.target.value)}
              placeholder={searchPlaceholder ?? labels.search}
              className="ps-8"
            />
          </label>
        ) : null}

        {filters.map((filter) => {
          const activeValue = columnFilters.find(
            (activeFilter) => activeFilter.id === filter.id
          )?.value as CiDataTableFilterValue | undefined;
          return filter.type === "text" ? (
            <label key={filter.id} className="min-w-44">
              <span className="sr-only">{filter.label}</span>
              <Input
                value={String(activeValue ?? "")}
                onChange={(event) =>
                  setToolbarFilter(filter.id, event.target.value || undefined)
                }
                placeholder={filter.placeholder ?? filter.label}
              />
            </label>
          ) : (
            <Select
              key={filter.id}
              value={
                activeValue === undefined
                  ? FILTER_ALL_VALUE
                  : encodeFilterValue(activeValue)
              }
              onValueChange={(value) =>
                setToolbarFilter(
                  filter.id,
                  value === FILTER_ALL_VALUE
                    ? undefined
                    : decodeFilterValue(value)
                )
              }
            >
              <SelectTrigger aria-label={filter.label}>
                <SelectValue placeholder={filter.placeholder ?? filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL_VALUE}>
                  {filter.allLabel ?? labels.allRows}
                </SelectItem>
                {filter.options?.map((option) => (
                  <SelectItem
                    key={`${option.id}`}
                    value={encodeFilterValue(option.id)}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}

        {formats.length > 1 ? (
          <Select
            value={format}
            onValueChange={(value) => setFormat(value as CiDataTableFormat)}
          >
            <SelectTrigger aria-label={labels.viewFormat}>
              {format === "cards" ? (
                <LayoutGrid className="size-4" aria-hidden />
              ) : (
                <List className="size-4" aria-hidden />
              )}
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formats.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <div className="ms-auto flex flex-wrap items-center gap-2">
          {selectionEnabled && selectedRows.length ? (
            <span className="text-muted-foreground text-sm" aria-live="polite">
              {selectedRows.length} {labels.selected}
            </span>
          ) : null}
          {globalActions.map((action) => {
            const selectionMode = action.selection ?? "required";
            const isVisible = action.isVisible?.(globalActionContext) ?? true;
            if (!isVisible) return null;
            const isBusy = busyActions.has(action.id);
            const disabled =
              isBusy ||
              (selectionMode === "required" && selectedRows.length === 0) ||
              (action.isDisabled?.(globalActionContext) ?? false);
            return (
              <Button
                key={action.id}
                type="button"
                variant={action.variant ?? "outline"}
                disabled={disabled}
                aria-busy={isBusy}
                onClick={() =>
                  void runGlobalAction(action.id, () =>
                    action.onSelect(globalActionContext)
                  )
                }
              >
                {isBusy ? (
                  <RefreshCw className="size-4 animate-spin" aria-hidden />
                ) : (
                  action.icon
                )}
                {action.label}
              </Button>
            );
          })}
          {showExport ? (
            <Button
              type="button"
              variant="outline"
              disabled={busyActions.has("__excel__")}
              aria-busy={busyActions.has("__excel__")}
              onClick={() =>
                void runGlobalAction("__excel__", () => exportExcel())
              }
            >
              {busyActions.has("__excel__") ? (
                <RefreshCw className="size-4 animate-spin" aria-hidden />
              ) : (
                <Download className="size-4" aria-hidden />
              )}
              {typeof config?.excelExport === "object"
                ? config.excelExport.label ?? labels.exportExcel
                : labels.exportExcel}
            </Button>
          ) : null}
        </div>
      </div>

      {resolvedError ? (
        <div
          role="alert"
          className="border-destructive/40 bg-destructive/5 text-destructive mb-3 rounded-md border p-3 text-sm"
        >
          {resolvedError}
        </div>
      ) : null}

      {format === "cards"
        ? renderCardsFormat()
        : renderTableFormat(format === "compact")}

      {paginationEnabled ? (
        <footer className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-muted-foreground text-sm">
            {labels.page} {pagination.pageIndex + 1}
            {totalPages ? ` / ${totalPages}` : ""}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground hidden text-sm sm:inline">
              {labels.rowsPerPage}
            </span>
            <Select
              value={String(pageSizeChoice)}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger size="sm" aria-label={labels.rowsPerPage}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
                {config?.pagination?.allowAll ? (
                  <SelectItem value="all">{labels.allRows}</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={labels.previousPage}
              disabled={!canPreviousPage || isLoading}
              onClick={goToPreviousPage}
            >
              <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={labels.nextPage}
              disabled={!canNextPage || isLoading || pageSizeChoice === "all"}
              onClick={goToNextPage}
            >
              <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
            </Button>
          </div>
        </footer>
      ) : null}
    </section>
  );
}
