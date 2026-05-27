import type { CiDataTableDataMode } from "./CiDataTableDataMode";
export type CiDataTableCursorConfig = {
    mode?: CiDataTableDataMode;
    pageSize?: number;
    pageSizeOptions?: number[];
    debounceMs?: number;
    maxCachedPages?: number;
    prefetchNextPage?: boolean;
    cacheKey?: string;
};
//# sourceMappingURL=CiDataTableCursorConfig.d.ts.map