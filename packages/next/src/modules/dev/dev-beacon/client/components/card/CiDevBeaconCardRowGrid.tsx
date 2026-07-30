import type { PropsWithChildren, ReactNode } from "react";

import { cn } from "@cloudigniter/ui/client";

export type CiDevBeaconCardRowGridColumns = 1 | 2 | 3 | 4;

interface CiDevBeaconCardRowGridProps extends PropsWithChildren {
  title?: ReactNode;
  columns?: CiDevBeaconCardRowGridColumns;
  boxed?: boolean;
  className?: string;
}

const columnClasses: Record<CiDevBeaconCardRowGridColumns, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
};

export function CiDevBeaconCardRowGrid({
  title,
  children,
  columns = 1,
  boxed = false,
  className,
}: CiDevBeaconCardRowGridProps) {
  return (
    <div className="space-y-2">
      {title && <h3 className="text-muted-foreground text-sm font-medium">{title}</h3>}

      <div
        className={cn(
          "grid gap-x-6 gap-y-2",
          "*:min-w-0",
          boxed && "*:rounded-md *:border *:border-border *:p-3",
          columnClasses[columns],
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
