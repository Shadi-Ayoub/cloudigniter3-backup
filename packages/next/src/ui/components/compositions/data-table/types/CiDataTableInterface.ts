import { type ColumnDef } from '@tanstack/react-table';
import type { CiLocaleDirection } from '@cloudigniter/types';

import type { CiCursorDataSource } from './CiCursorDataSource';
import type { CiDataTableAction } from './CiDataTableAction';
import type { CiDataTableCursorConfig } from './CiDataTableCursorConfig';

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
  source?: CiCursorDataSource<TData>;

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
