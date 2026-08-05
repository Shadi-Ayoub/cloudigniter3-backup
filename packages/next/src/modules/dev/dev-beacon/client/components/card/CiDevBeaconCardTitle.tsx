"use client";

import type { ReactNode } from "react";

import { CardDescription, CardTitle, cn } from "@cloudigniter/ui/client";

import { CiDevBeaconTooltipBalloon } from "./CiDevBeaconTooltipBalloon";

export interface CiDevBeaconCardTitleProps {
  title: string;
  description?: ReactNode;
  tooltip?: ReactNode;
  tooltipAriaLabel?: string;
  id?: string;
  className?: string;
}

export function CiDevBeaconCardTitle({
  title,
  description,
  tooltip,
  tooltipAriaLabel = "More information",
  id,
  className,
}: CiDevBeaconCardTitleProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <CardTitle id={id} className="text-sm font-semibold">
        {tooltip ? (
          <CiDevBeaconTooltipBalloon
            label={title}
            tooltip={tooltip}
            tooltipAriaLabel={tooltipAriaLabel}
            labelTextSize="text-sm"
          />
        ) : (
          title
        )}
      </CardTitle>

      {description ? <CardDescription className="text-xs leading-5">{description}</CardDescription> : null}
    </div>
  );
}
