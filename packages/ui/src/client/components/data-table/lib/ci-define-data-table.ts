import type { RowData } from "@tanstack/react-table";
import type {
  CiDataTableColumnDef,
  CiDataTableDataSource,
  CiDataTableDefinition,
} from "@ci-ui/types";

/** Preserves inference while validating a reusable data-table definition. */
export function ciDefineDataTable<TData extends RowData>(
  definition: CiDataTableDefinition<TData>
): CiDataTableDefinition<TData> {
  return definition;
}

/** Preserves row and cell-value inference for a CloudIgniter table column. */
export function ciDefineDataTableColumn<
  TData extends RowData,
  TValue = unknown
>(
  column: CiDataTableColumnDef<TData, TValue>
): CiDataTableColumnDef<TData, TValue> {
  return column;
}

/** Preserves row inference while validating a provider data-source adapter. */
export function ciCreateDataTableDataSource<TData>(
  source: CiDataTableDataSource<TData>
): CiDataTableDataSource<TData> {
  return source;
}
