import type { CiDataTableCursorQuery } from "./CiDataTableCursorQuery";
import type { CiDataTableCursorPage } from "./CiDataTableCursorPage";
export type CiDataTableCursorDataSource<T> = {
    /**
     * Execute a server query and return a page.
     */
    fetchPage: (q: CiDataTableCursorQuery) => Promise<CiDataTableCursorPage<T>>;
};
//# sourceMappingURL=CiDataTableCursorDataSource.d.ts.map