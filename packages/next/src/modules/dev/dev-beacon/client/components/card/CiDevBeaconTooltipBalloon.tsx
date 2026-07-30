import type { ReactNode } from "react";
import { CircleHelp, Info } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@cloudigniter/ui/client";

interface CiDevBeaconTooltipBalloonProps {
  label: string;
  tooltip?: ReactNode;

  /**
   * Tailwind class controlling the label text size.
   *
   * @default "text-xm"
   */
  labelTextSize?: string;
}

export function CiDevBeaconTooltipBalloon({
  tooltip,
  label,
  labelTextSize = "text-xm",
}: CiDevBeaconTooltipBalloonProps) {
  return (
    <span className="shrink-0">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className={labelTextSize}>{label}</span>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`About ${label}`}
              className={[
                "text-muted-foreground/70 hover:text-foreground",
                "focus-visible:ring-ring/60 inline-flex size-4 shrink-0",
                "items-center justify-center rounded-full",
                "transition-colors focus-visible:ring-2 focus-visible:outline-none",
              ].join(" ")}
            >
              <CircleHelp className="size-3.5" aria-hidden="true" />
            </button>
          </TooltipTrigger>

          <TooltipContent
            side="top"
            align="start"
            sideOffset={6}
            showArrow={false}
            className={[
              "z-(--z-index-dev-beacon-tooltip)",
              "relative max-w-72 overflow-visible border px-3 py-2 shadow-md",
              "text-xs leading-relaxed",
              "border-[#d6b94c] bg-[#fff3a3] text-[#3f3500]",
              "dark:border-[#8f7927] dark:bg-[#3d350f] dark:text-[#fff1a8]",
            ].join(" ")}
          >
            <div className="flex items-start gap-2">
              <Info
                className={["mt-0.5 size-3.5 shrink-0", "text-[#8a6d00] dark:text-[#f4cf45]"].join(" ")}
                aria-hidden="true"
              />

              <div className="min-w-0">{typeof tooltip === "string" ? <p>{tooltip}</p> : tooltip}</div>
            </div>

            {/* Triangle border */}
            <span
              aria-hidden="true"
              className={[
                "absolute -bottom-1.5 left-0.75 size-0",
                "border-x-[6px] border-t-[6px]",
                "border-x-transparent",
                "border-t-[#d6b94c] dark:border-t-[#8f7927]",
              ].join(" ")}
            />

            {/* Triangle fill */}
            <span
              aria-hidden="true"
              className={[
                "absolute -bottom-1.25 left-1 size-0",
                "border-x-[5px] border-t-[5px]",
                "border-x-transparent",
                "border-t-[#fff3a3] dark:border-t-[#3d350f]",
              ].join(" ")}
            />
          </TooltipContent>
        </Tooltip>
      </div>
    </span>
  );
}
