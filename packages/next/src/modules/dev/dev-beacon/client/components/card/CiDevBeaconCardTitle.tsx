"use client";

import type { ReactNode } from "react";
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
    <div className={className}>
      <div className="flex items-center gap-1.5">
        <h5 id={id} className="text-sm font-semibold">
          {tooltip ? <CiDevBeaconTooltipBalloon label={title} tooltip={tooltip} labelTextSize="text-lg" /> : title}
        </h5>
      </div>

      {description ? <p className="text-muted-foreground mt-1 text-xs leading-5">{description}</p> : null}
    </div>
  );
}
