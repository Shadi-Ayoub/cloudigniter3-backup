import type { CiDataTableSortSpec } from "./CiDataTableSortSpec";
export type CiDataTableCursorQuery = {
    search?: string;
    sort?: CiDataTableSortSpec[];
    pageSize: number;
    cursor?: string | null;
    direction?: "next" | "prev";
};
//# sourceMappingURL=CiDataTableCursorQuery.d.ts.map