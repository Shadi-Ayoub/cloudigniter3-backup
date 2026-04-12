import type { CiCursorQuery } from './CiCursorQuery';
import type { CiCursorPage } from './CiCursorPage';

export type CiCursorDataSource<T> = {
  /**
   * Execute a server query and return a page.
   */
  fetchPage: (q: CiCursorQuery) => Promise<CiCursorPage<T>>;
};
