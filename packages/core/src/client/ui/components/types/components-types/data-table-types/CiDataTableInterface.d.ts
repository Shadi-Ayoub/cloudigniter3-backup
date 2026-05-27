import { type ColumnDef } from "@tanstack/react-table";
import type { CiLocaleDirection } from "@ci-core/types";
import type { CiDataTableCursorDataSource } from "./CiDataTableCursorDataSource";
import type { CiDataTableAction } from "./CiDataTableAction";
import type { CiDataTableCursorConfig } from "./CiDataTableCursorConfig";
export type CiDataTableInterface<TData, TValue> = {
    title?: string;
    description?: string;
    columns: ColumnDef<TData, TValue>[];
    /**
     * Client mode: provide data directly.
     */
    data?: TData[];
    /**
     * Server/Hybrid mode: provide a data source.
     */
    source?: CiDataTableCursorDataSource<TData>;
    /**
     * Optional: If provided, DataTable will render an "Actions" column at the end.
     */
    rowActions?: CiDataTableAction<TData>[];
    /**
     * UX props
     */
    searchPlaceholder?: string;
    className?: string;
    config?: CiDataTableCursorConfig;
    direction?: CiLocaleDirection;
};
//# sourceMappingURL=CiDataTableInterface.d.ts.map