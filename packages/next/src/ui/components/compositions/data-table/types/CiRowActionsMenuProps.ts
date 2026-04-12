import type { CiDataTableAction } from "./CiDataTableAction";

export type CiRowActionsMenuProps<TData> = {
  row: TData;
  actions: CiDataTableAction<TData>[];

  /**
   * Optional UI overrides
   */
  triggerLabel?: React.ReactNode; // defaults to ellipsis
  className?: string;
  align?: "start" | "center" | "end";
  minWidthClassName?: string; // defaults to min-w-[180px]
};
