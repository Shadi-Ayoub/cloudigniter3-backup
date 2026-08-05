import type { ReactNode } from "react";

import { cn } from "@cloudigniter/ui/client";

import { CiDevBeaconTooltipBalloon } from "./CiDevBeaconTooltipBalloon";

export interface CiDevBeaconCardSummaryValueProps {
  label: string;
  value: ReactNode;
  tooltip?: ReactNode;
  tooltipAriaLabel?: string;
  mono?: boolean;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

export function CiDevBeaconCardSummaryValue({
  label,
  value,
  tooltip,
  tooltipAriaLabel,
  mono = false,
  className,
  labelClassName,
  valueClassName,
}: CiDevBeaconCardSummaryValueProps) {
  return (
    <div className={cn("border-border min-w-0 rounded-md border p-3", className)}>
      <div className={cn("text-muted-foreground text-xs", labelClassName)}>
        {tooltip ? (
          <CiDevBeaconTooltipBalloon
            label={label}
            tooltip={tooltip}
            tooltipAriaLabel={tooltipAriaLabel}
            labelTextSize="text-xs"
          />
        ) : (
          label
        )}
      </div>

      <div className={cn("mt-1 block break-all text-sm font-semibold", mono && "font-mono text-xs", valueClassName)}>
        {value}
      </div>
    </div>
  );
}
