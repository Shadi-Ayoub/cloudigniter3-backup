import type { CiDataTableDataMode } from "./CiDataTableDataMode";

export type CiDataTableCursorConfig = {
  mode?: CiDataTableDataMode;
  pageSize?: number;
  pageSizeOptions?: number[];
  debounceMs?: number;

  // Hybrid cache controls (visited pages only)
  maxCachedPages?: number; // e.g. 5
  prefetchNextPage?: boolean; // optional
  cacheKey?: string; // separate caches per table
};
