import type { CiDataTableSortSpec } from "./CiDataTableSortSpec";

export type CiDataTableCursorQuery = {
  search?: string;
  sort?: CiDataTableSortSpec[];
  pageSize: number;

  // cursor pagination
  cursor?: string | null; // forward cursor (e.g., LastEvaluatedKey encoded)
  direction?: "next" | "prev"; // if your backend supports backward paging; optional
};
