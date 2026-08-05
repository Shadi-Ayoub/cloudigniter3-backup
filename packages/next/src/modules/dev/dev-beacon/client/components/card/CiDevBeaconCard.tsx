"use client";

import type { ComponentProps, CSSProperties, PropsWithChildren, ReactNode } from "react";

import { Card, CardContent, CardHeader, cn, TooltipProvider } from "@cloudigniter/ui/client";

import { CiDevBeaconCardTitle } from "./CiDevBeaconCardTitle";

type CiDevBeaconCardTitleProps = ComponentProps<typeof CiDevBeaconCardTitle>;

export type CiDevBeaconCardProps = PropsWithChildren<
  Omit<CiDevBeaconCardTitleProps, "className"> & {
    /**
     * Maximum card height before its content becomes scrollable.
     *
     * Numeric values are interpreted as pixels.
     *
     * @default "32rem"
     */
    maxHeight?: CSSProperties["maxHeight"];

    /**
     * Optional control displayed on the opposite side of the card title.
     */
    headerAction?: ReactNode;

    dir?: "ltr" | "rtl" | "auto";
    className?: string;
    titleClassName?: string;
    contentClassName?: string;
  }
>;

export function CiDevBeaconCard({
  title,
  description,
  tooltip,
  tooltipAriaLabel,
  id,
  children,
  headerAction,
  maxHeight = "32rem",
  dir,
  className,
  titleClassName,
  contentClassName,
}: CiDevBeaconCardProps) {
  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={100}>
      <Card
        dir={dir}
        style={{ maxHeight }}
        className={cn("flex min-h-0 flex-col gap-0 overflow-hidden py-0", className)}
      >
        <CardHeader className="bg-card shrink-0 border-b px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <CiDevBeaconCardTitle
              id={id}
              title={title}
              description={description}
              tooltip={tooltip}
              tooltipAriaLabel={tooltipAriaLabel}
              className={cn("min-w-0 flex-1", titleClassName)}
            />

            {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
          </div>
        </CardHeader>

        <CardContent
          className={cn(
            "min-h-0 flex-1 touch-pan-y space-y-2 overflow-y-auto overscroll-contain p-4",
            contentClassName,
          )}
        >
          {children}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
