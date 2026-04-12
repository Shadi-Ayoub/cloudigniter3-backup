import type { CiSortSpec } from './CiSortSpec';

export type CiCursorQuery = {
  search?: string;
  sort?: CiSortSpec[];
  pageSize: number;

  // cursor pagination
  cursor?: string | null; // forward cursor (e.g., LastEvaluatedKey encoded)
  direction?: 'next' | 'prev'; // if your backend supports backward paging; optional
};
