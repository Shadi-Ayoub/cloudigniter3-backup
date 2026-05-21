import type { ColumnDef, CellContext } from "@tanstack/react-table";
import type { CiDataTableAction } from "@/client";

export function buildDataTableColumnsWithActions<TData, TValue>(args: {
  columns: ColumnDef<TData, TValue>[];
  rowActions?: CiDataTableAction<TData>[];
  renderActionsCell: (
    ctx: CellContext<TData, unknown>,
    actions: CiDataTableAction<TData>[],
  ) => React.ReactNode;
  actionsHeader?: string;
}): ColumnDef<TData, TValue>[] {
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
      cell: (ctx) => renderActionsCell(ctx as any, rowActions),
      enableSorting: false,
    } as ColumnDef<TData, TValue>,
  ];
}
