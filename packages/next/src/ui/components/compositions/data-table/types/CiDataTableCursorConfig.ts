import type { CiDataMode } from './CiDataMode';

export type CiDataTableCursorConfig = {
  mode?: CiDataMode;
  pageSize?: number;
  pageSizeOptions?: number[];
  debounceMs?: number;

  // Hybrid cache controls (visited pages only)
  maxCachedPages?: number; // e.g. 5
  prefetchNextPage?: boolean; // optional
  cacheKey?: string; // separate caches per table
};
