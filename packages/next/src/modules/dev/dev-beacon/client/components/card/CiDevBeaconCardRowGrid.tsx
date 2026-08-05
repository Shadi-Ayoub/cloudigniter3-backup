import type { PropsWithChildren, ReactNode } from "react";

import { cn } from "@cloudigniter/ui/client";

export type CiDevBeaconCardRowGridColumns = 1 | 2 | 3 | 4;
export type CiDevBeaconCardRowGridCellPadding = "none" | "compact" | "default" | "comfortable";

interface CiDevBeaconCardRowGridProps extends PropsWithChildren {
  title?: ReactNode;
  columns?: CiDevBeaconCardRowGridColumns;
  boxed?: boolean;

  /**
   * Controls the padding inside boxed grid cells.
   *
   * @default "default"
   */
  cellPadding?: CiDevBeaconCardRowGridCellPadding;

  className?: string;
}

const columnClasses: Record<CiDevBeaconCardRowGridColumns, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
};

const cellPaddingClasses: Record<CiDevBeaconCardRowGridCellPadding, string> = {
  none: "*:p-0",
  compact: "*:p-2",
  default: "*:p-3",
  comfortable: "*:p-4",
};

export function CiDevBeaconCardRowGrid({
  title,
  children,
  columns = 1,
  boxed = false,
  cellPadding = "default",
  className,
}: CiDevBeaconCardRowGridProps) {
  return (
    <div className="space-y-2">
      {title && (
        <h3 className="border-gray-500 bg-muted/70 text-foreground rounded-md border px-3 py-1.5 text-sm font-medium">
          {title}
        </h3>
      )}

      <div
        className={cn(
          "grid gap-x-6 gap-y-2",
          "*:min-w-0",
          boxed && ["*:rounded-md", "*:border", "*:border-border", cellPaddingClasses[cellPadding]],
          columnClasses[columns],
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
