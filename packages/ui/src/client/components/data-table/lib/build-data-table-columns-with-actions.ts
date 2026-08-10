import type { CellContext, ColumnDef, RowData } from "@tanstack/react-table";
import type { CiDataTableFeatures } from "@ci-ui/common";
import type { CiDataTableAction } from "@ci-ui/types";

export function buildDataTableColumnsWithActions<
  TData extends RowData,
  TValue
>(args: {
  columns: ColumnDef<CiDataTableFeatures, TData, TValue>[];
  rowActions?: CiDataTableAction<TData>[];
  renderActionsCell: (
    ctx: CellContext<CiDataTableFeatures, TData, TValue>,
    actions: CiDataTableAction<TData>[]
  ) => React.ReactNode;
  actionsHeader?: string;
}): ColumnDef<CiDataTableFeatures, TData, TValue>[] {
  const {
    columns,
    rowActions,
    renderActionsCell,
    actionsHeader = "Actions",
  } = args;

  if (!rowActions?.length) return columns;

  return [
    ...columns,
    {
      id: "__actions__",
      header: () => actionsHeader,
      cell: (ctx) => renderActionsCell(ctx, rowActions),
      enableSorting: false,
    } as ColumnDef<CiDataTableFeatures, TData, TValue>,
  ];
}
