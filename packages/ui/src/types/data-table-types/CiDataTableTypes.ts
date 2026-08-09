import type { ReactNode } from "react";
import type {
  ColumnDef,
  ColumnMeta,
  FilterFnOption,
  RowData,
} from "@tanstack/react-table";
import type { CiLocaleDirection } from "@cloudigniter/core/types";
import type { CiDataTableFeatures } from "@ci-ui/common";

/** Describes one active sort rule, in priority order. */
export type CiDataTableSortSpec = { id: string; desc: boolean };

/** Describes one serializable column or toolbar filter. */
export type CiDataTableFilterValue =
  | string
  | number
  | boolean
  | Array<string | number>
  | null;

/** Describes one active filter sent to a data source. */
export type CiDataTableFilterSpec = {
  id: string;
  value: CiDataTableFilterValue;
};

/** Identifies the built-in visual layouts and permits application-defined names. */
export type CiDataTableFormat = "table" | "compact" | "cards";

/** Describes an item in the view-format selector. */
export type CiDataTableFormatOption = {
  id: CiDataTableFormat;
  label: string;
};

/** Describes one typed option in a select-based table filter. */
export type CiDataTableFilterOption = {
  id: string | number | boolean;
  label: string;
};

/** Describes the page size sent to client or provider-backed data sources. */
export type CiDataTablePageSize = number | "all";

/** Contains the complete, serializable query passed to a data source. */
export type CiDataTableQuery = {
  globalFilter?: string;
  /** @deprecated Use globalFilter. Retained for existing cursor handlers. */
  search?: string;
  filters: CiDataTableFilterSpec[];
  sorting: CiDataTableSortSpec[];
  /** @deprecated Use sorting. Retained for existing cursor handlers. */
  sort?: CiDataTableSortSpec[];
  pageIndex: number;
  pageSize: CiDataTablePageSize;
  cursor?: string | null;
  direction?: "next" | "prev";
  format: CiDataTableFormat;
};

/** Contains a page returned by a provider-backed table handler. */
export type CiDataTablePage<TData> = {
  rows: TData[];
  totalRowCount?: number;
  nextCursor?: string | null;
  prevCursor?: string | null;
};

/** Connects the table to any database, API, or provider handler. */
export type CiDataTableDataSource<TData> = {
  fetchPage: (
    query: CiDataTableQuery,
    signal?: AbortSignal
  ) => Promise<CiDataTablePage<TData>>;
  /** Fetches every row matching active filters and sorting for full exports. */
  fetchAll?: (
    query: Omit<CiDataTableQuery, "cursor" | "pageIndex" | "pageSize">,
    signal?: AbortSignal
  ) => Promise<TData[]>;
};

/** Provides the normalized value and row to column callbacks. */
export type CiDataTableCellContext<TData, TValue = unknown> = {
  row: TData;
  value: TValue;
  columnId: string;
};

/** Configures optional table-specific behavior for a TanStack column. */
export type CiDataTableColumnMeta<TData, TValue = unknown> = {
  label?: string;
  className?:
    | string
    | ((context: CiDataTableCellContext<TData, TValue>) => string | undefined);
  headerClassName?: string;
  truncate?:
    | boolean
    | number
    | {
        maxWidth?: number | string;
        showTitle?: boolean;
      };
  clickable?: {
    onClick?: (context: CiDataTableCellContext<TData, TValue>) => void;
    href?: (context: CiDataTableCellContext<TData, TValue>) => string;
    ariaLabel?: (context: CiDataTableCellContext<TData, TValue>) => string;
  };
  filter?: {
    type?: "text" | "select";
    placeholder?: string;
    options?: CiDataTableFilterOption[];
  };
  export?:
    | boolean
    | {
        header?: string;
        value?: (row: TData) => unknown;
      };
};

/** Adds CloudIgniter metadata to a native TanStack column definition. */
export type CiDataTableColumnDef<
  TData extends RowData,
  TValue = unknown
> = ColumnDef<CiDataTableFeatures, TData, TValue> extends infer TColumn
  ? TColumn extends ColumnDef<CiDataTableFeatures, TData, TValue>
    ? Omit<TColumn, "meta"> & {
        meta?: ColumnMeta<CiDataTableFeatures, TData, TValue> & {
          ciDataTable?: CiDataTableColumnMeta<TData, TValue>;
        };
      }
    : never
  : never;

/** Describes one filter rendered in the table toolbar. */
export type CiDataTableFilter<TData extends RowData> = {
  id: string;
  label: string;
  type?: "select" | "text";
  placeholder?: string;
  allLabel?: string;
  options?: CiDataTableFilterOption[];
  defaultValue?: CiDataTableFilterValue;
  filterFn?: FilterFnOption<CiDataTableFeatures, TData>;
};

/** Describes the context provided to row-action callbacks. */
export type CiDataTableRowActionContext<TData> = {
  row: TData;
  query: CiDataTableQuery;
  refresh: () => void;
};

/** Describes an action available for an individual row. */
export type CiDataTableAction<TData> = {
  id: string;
  label: string;
  icon?: ReactNode;
  display?: "button" | "icon";
  variant?: "default" | "destructive";
  /** Hides the action when the predicate matches the current record. */
  hideWhen?: (row: TData) => boolean;
  /** Disables the action when the predicate matches the current record. */
  disableWhen?: (row: TData) => boolean;
  /** @deprecated Prefer hideWhen for positive condition semantics. */
  isVisible?: (row: TData) => boolean;
  /** @deprecated Prefer disableWhen for positive condition semantics. */
  isDisabled?: (row: TData) => boolean;
  onSelect: (
    row: TData,
    context?: CiDataTableRowActionContext<TData>
  ) => void | Promise<void>;
};

/** Configures the built-in, first-position record information control. */
export type CiDataTableInformation<TData> = {
  /** A hover/focus tooltip or a click-activated modal dialog. */
  mode?: "tooltip" | "dialog";
  /** Icon-only by default; button also renders the label. */
  display?: "icon" | "button";
  label?: string;
  title?: ReactNode | ((row: TData) => ReactNode);
  description?: ReactNode | ((row: TData) => ReactNode);
  content: ReactNode | ((row: TData) => ReactNode);
  dialogClassName?: string;
  hideWhen?: (row: TData) => boolean;
  disableWhen?: (row: TData) => boolean;
  /** @deprecated Prefer hideWhen for positive condition semantics. */
  isVisible?: (row: TData) => boolean;
  /** @deprecated Prefer disableWhen for positive condition semantics. */
  isDisabled?: (row: TData) => boolean;
};

/** Describes the context provided to table-wide action callbacks. */
export type CiDataTableGlobalActionContext<TData> = {
  selectedRows: TData[];
  query: CiDataTableQuery;
  clearSelection: () => void;
  refresh: () => void;
  exportExcel: () => Promise<void>;
};

/** Describes a table-wide action in the top toolbar. */
export type CiDataTableGlobalAction<TData> = {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  selection?: "required" | "optional" | "none";
  isVisible?: (context: CiDataTableGlobalActionContext<TData>) => boolean;
  isDisabled?: (context: CiDataTableGlobalActionContext<TData>) => boolean;
  onSelect: (
    context: CiDataTableGlobalActionContext<TData>
  ) => void | Promise<void>;
};

/** Groups columns, filters, actions, and identity into a reusable definition. */
export type CiDataTableDefinition<TData extends RowData> = {
  columns: CiDataTableColumnDef<TData, unknown>[];
  information?: CiDataTableInformation<TData>;
  rowActions?: CiDataTableAction<TData>[];
  globalActions?: CiDataTableGlobalAction<TData>[];
  filters?: CiDataTableFilter<TData>[];
  getRowId?: (row: TData, index: number) => string;
};

/** Configures the built-in Excel workbook download. */
export type CiDataTableExcelConfig = {
  enabled?: boolean;
  label?: string;
  fileName?: string;
  sheetName?: string;
  scope?: "all-filtered" | "current-page" | "selected";
};

/** Configures cookie-based user preference retention. */
export type CiDataTablePersistenceConfig = {
  key: string;
  cookieName?: string;
  maxAgeDays?: number;
  columnWidths?: boolean;
  filters?: boolean;
  pageSize?: boolean;
  format?: boolean;
};

/** Contains the preferences stored in the browser cookie. */
export type CiDataTablePreferences = {
  columnWidths?: Record<string, number>;
  filters?: CiDataTableFilterSpec[];
  globalFilter?: string;
  pageSize?: CiDataTablePageSize;
  format?: CiDataTableFormat;
};

/** Configures table behavior without coupling it to its rows or columns. */
export type CiDataTableConfig<TData = unknown> = {
  mode?: CiDataTableDataMode;
  formats?: CiDataTableFormatOption[];
  defaultFormat?: CiDataTableFormat;
  sorting?: {
    enabled?: boolean;
    initial?: CiDataTableSortSpec[];
  };
  filtering?: {
    global?: boolean;
    debounceMs?: number;
  };
  pagination?: {
    enabled?: boolean;
    pageSize?: number;
    pageSizeOptions?: number[];
    allowAll?: boolean;
  };
  selection?: {
    enabled?: boolean;
    enableRow?: (row: TData) => boolean;
  };
  rowActions?: {
    mode?: "buttons" | "menu" | "mixed";
    inlineCount?: number;
    header?: string;
  };
  columnResizing?: boolean;
  hoverHighlight?: boolean;
  stripedRows?: boolean;
  width?: number | string;
  labels?: Partial<{
    search: string;
    loading: string;
    noResults: string;
    actions: string;
    selected: string;
    previousPage: string;
    nextPage: string;
    page: string;
    rowsPerPage: string;
    allRows: string;
    viewFormat: string;
    exportExcel: string;
    selectAll: string;
    selectRow: string;
  }>;
  persistence?: CiDataTablePersistenceConfig;
  excelExport?: boolean | CiDataTableExcelConfig;
  maxCachedPages?: number;
  prefetchNextPage?: boolean;
  cacheKey?: string;
  /** @deprecated Use pagination.pageSize. */
  pageSize?: number;
  /** @deprecated Use pagination.pageSizeOptions. */
  pageSizeOptions?: number[];
  /** @deprecated Use filtering.debounceMs. */
  debounceMs?: number;
};

/** Defines the complete public component contract. */
export type CiDataTableInterface<TData extends RowData, TValue = unknown> = {
  title?: string;
  description?: string;
  definition?: CiDataTableDefinition<TData>;
  /** Retained as the concise/legacy alternative to definition.columns. */
  columns?: CiDataTableColumnDef<TData, TValue>[];
  data?: TData[];
  source?: CiDataTableDataSource<TData>;
  /** Retained as the concise/legacy alternative to definition.rowActions. */
  rowActions?: CiDataTableAction<TData>[];
  searchPlaceholder?: string;
  className?: string;
  config?: CiDataTableConfig<TData>;
  direction?: CiLocaleDirection;
  loading?: boolean;
  error?: ReactNode;
  emptyState?: ReactNode;
  onQueryChange?: (query: CiDataTableQuery) => void;
  onSelectionChange?: (rows: TData[]) => void;
};

/** Describes the supported client/provider execution strategies. */
export type CiDataTableDataMode = "client" | "server" | "hybrid" | "auto";

/** Retains the original cursor data-source name as a public alias. */
export type CiDataTableCursorDataSource<TData> = CiDataTableDataSource<TData>;

/** Retains the original cursor page name as a public alias. */
export type CiDataTableCursorPage<TData> = CiDataTablePage<TData>;

/** Retains the original cursor query name as a public alias. */
export type CiDataTableCursorQuery = CiDataTableQuery;

/** Retains the original cursor configuration name as a public alias. */
export type CiDataTableCursorConfig = CiDataTableConfig;

/** Retains the original page-cache name as a public alias. */
export type CiDataTablePageCache<TData> = Map<string, CiDataTablePage<TData>>;

/** Defines the standalone row-actions menu contract. */
export type CiDataTableRowActionsMenuProps<TData> = {
  row: TData;
  actions: CiDataTableAction<TData>[];
  context?: CiDataTableRowActionContext<TData>;
  triggerLabel?: ReactNode;
  triggerAriaLabel?: string;
  className?: string;
  align?: "start" | "center" | "end";
  minWidthClassName?: string;
};

/** Defines one column in an exported Excel workbook. */
export type CiDataTableExcelColumn<TData> = {
  id: string;
  header: string;
  value: (row: TData) => unknown;
  width?: number;
};

/** Defines the standalone Excel-export helper input. */
export type CiDataTableExcelExportOptions<TData> = {
  rows: TData[];
  columns: CiDataTableExcelColumn<TData>[];
  fileName?: string;
  sheetName?: string;
};
