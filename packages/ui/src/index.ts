// ─────────────────────────────────────────────────────────────
// common
// ─────────────────────────────────────────────────────────────
import {
  // round button fallback
  CiRoundButtonFallback,
} from "./common";
export {
  // round button fallback
  CiRoundButtonFallback,
};

// ─────────────────────────────────────────────────────────────
// data table (client component and universal definition helpers)
// ─────────────────────────────────────────────────────────────
export {
  CiDataTable,
  CiDataTableRowActions,
  CiDataTableRowActionsMenu,
  ciBuildDataTableExcelWorkbook,
  ciClearDataTablePreferences,
  ciCreateDataTableDataSource,
  ciDefineDataTable,
  ciDefineDataTableColumn,
  ciExportDataTableToExcel,
  ciGetDataTablePreferenceCookieName,
  ciIsDataTableControlDisabled,
  ciIsDataTableControlVisible,
  ciLoadDataTablePreferences,
  ciSaveDataTablePreferences,
} from "./client/components/data-table";

export { CiSecurityDataPage } from "./client/security";

export type { CiDataTableConditionalControl } from "./client/components/data-table";

export {
  ciDataTableFeatures,
  type CiDataTableFeatures,
} from "./common/data-table";

export type {
  CiDataTableAction,
  CiDataTableCellContext,
  CiDataTableColumnDef,
  CiDataTableColumnMeta,
  CiDataTableConfig,
  CiDataTableCursorConfig,
  CiDataTableCursorDataSource,
  CiDataTableCursorPage,
  CiDataTableCursorQuery,
  CiDataTableDataMode,
  CiDataTableDataSource,
  CiDataTableDefinition,
  CiDataTableExcelColumn,
  CiDataTableExcelConfig,
  CiDataTableExcelExportOptions,
  CiDataTableFilter,
  CiDataTableFilterOption,
  CiDataTableFilterSpec,
  CiDataTableFilterValue,
  CiDataTableFormat,
  CiDataTableFormatOption,
  CiDataTableGlobalAction,
  CiDataTableGlobalActionContext,
  CiDataTableInterface,
  CiDataTableInformation,
  CiDataTablePage,
  CiDataTablePageCache,
  CiDataTablePageSize,
  CiDataTablePersistenceConfig,
  CiDataTablePreferences,
  CiDataTableQuery,
  CiDataTableRowActionContext,
  CiDataTableRowActionsMenuProps,
  CiDataTableSortSpec,
  CiSecurityDataPageProps,
} from "./types";
