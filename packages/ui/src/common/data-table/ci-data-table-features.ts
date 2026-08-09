import {
  columnFilteringFeature,
  columnResizingFeature,
  columnSizingFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_equals,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";

/**
 * The explicit TanStack Table v9 feature set used by CiDataTable.
 *
 * Keeping this stable and shared gives consumers correctly feature-gated
 * column definitions without falling back to the v8-style stock bundle.
 */
export const ciDataTableFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
    equals: filterFn_equals,
  },
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  rowSelectionFeature,
  columnSizingFeature,
  columnResizingFeature,
});

/** The feature map threaded through the public TanStack v9 column types. */
export type CiDataTableFeatures = typeof ciDataTableFeatures;
