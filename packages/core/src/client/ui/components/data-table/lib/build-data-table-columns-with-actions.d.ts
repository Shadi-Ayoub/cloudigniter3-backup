import type { ColumnDef, CellContext } from "@tanstack/react-table";
import type { CiDataTableAction } from "@ci-core/client";
export declare function buildDataTableColumnsWithActions<TData, TValue>(args: {
    columns: ColumnDef<TData, TValue>[];
    rowActions?: CiDataTableAction<TData>[];
    renderActionsCell: (ctx: CellContext<TData, unknown>, actions: CiDataTableAction<TData>[]) => React.ReactNode;
    actionsHeader?: string;
}): ColumnDef<TData, TValue>[];
//# sourceMappingURL=build-data-table-columns-with-actions.d.ts.map