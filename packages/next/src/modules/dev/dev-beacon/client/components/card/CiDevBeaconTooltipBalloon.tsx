import type { ReactNode } from "react";
import { CircleHelp } from "lucide-react";

import {
  CiTooltipBalloon,
  Tooltip,
  TooltipTrigger,
} from "@cloudigniter/ui/client";

interface CiDevBeaconTooltipBalloonProps {
  label: string;
  tooltip?: ReactNode;

  /**
   * Tailwind class controlling the label text size.
   *
   * @default "text-xm"
   */
  labelTextSize?: string;
  tooltipAriaLabel?: string;
}

export function CiDevBeaconTooltipBalloon({
  tooltip,
  label,
  labelTextSize = "text-xm",
  tooltipAriaLabel,
}: CiDevBeaconTooltipBalloonProps) {
  return (
    <span className="shrink-0">
      <div className="flex min-w-0 items-center gap-0.5">
        <span className={labelTextSize}>{label}</span>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={tooltipAriaLabel ?? `About ${label}`}
              className={[
                "text-muted-foreground/70 hover:text-foreground",
                "focus-visible:ring-ring/60 inline-flex size-4 shrink-0",
                "-translate-y-1 items-center justify-center rounded-full",
                "transition-colors focus-visible:ring-2 focus-visible:outline-none",
              ].join(" ")}
            >
              <CircleHelp className="size-3.5" aria-hidden="true" />
            </button>
          </TooltipTrigger>

          <CiTooltipBalloon
            content={tooltip}
            zIndex="var(--z-index-dev-beacon-tooltip)"
            side="top"
            align="start"
            sideOffset={6}
          />
        </Tooltip>
      </div>
    </span>
  );
}
