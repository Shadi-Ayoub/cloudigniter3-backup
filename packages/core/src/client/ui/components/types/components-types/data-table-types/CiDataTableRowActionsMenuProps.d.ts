import type { CiDataTableAction } from "./CiDataTableAction";
export type CiDataTableRowActionsMenuProps<TData> = {
    row: TData;
    actions: CiDataTableAction<TData>[];
    /**
     * Optional UI overrides
     */
    triggerLabel?: React.ReactNode;
    className?: string;
    align?: "start" | "center" | "end";
    minWidthClassName?: string;
};
//# sourceMappingURL=CiDataTableRowActionsMenuProps.d.ts.map