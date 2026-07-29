"use client";

import type { ReactNode } from "react";
import { CircleHelp, Info } from "lucide-react";

import { cn, Tooltip, TooltipContent, TooltipTrigger } from "@cloudigniter/ui/client";

export interface CiDevBeaconCardTitleProps {
  title: ReactNode;
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
          {title}
        </h5>

        {tooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={tooltipAriaLabel}
                className={cn(
                  "text-muted-foreground/70 hover:text-foreground",
                  "focus-visible:ring-ring/60 inline-flex size-4 shrink-0",
                  "items-center justify-center rounded-full",
                  "transition-colors focus-visible:ring-2 focus-visible:outline-none",
                )}
              >
                <CircleHelp aria-hidden="true" className="size-3.5" />
              </button>
            </TooltipTrigger>

            <TooltipContent
              side="top"
              align="start"
              sideOffset={6}
              showArrow={false}
              className={cn(
                "z-(--z-index-dev-beacon-tooltip)",
                "relative max-w-72 overflow-visible border px-3 py-2 shadow-md",
                "text-xs leading-relaxed",

                // Light mode
                "border-[#d6b94c] bg-[#fff3a3] text-[#3f3500]",

                // Dark mode
                "dark:border-[#8f7927] dark:bg-[#3d350f] dark:text-[#fff1a8]",
              )}
            >
              <div className="flex items-start gap-2">
                <Info
                  aria-hidden="true"
                  className={cn("mt-0.5 size-3.5 shrink-0", "text-[#8a6d00] dark:text-[#f4cf45]")}
                />

                <div className="min-w-0">{typeof tooltip === "string" ? <p>{tooltip}</p> : tooltip}</div>
              </div>

              {/* Triangle border */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute -bottom-1.5 left-0.75 size-0",
                  "border-x-[6px] border-t-[6px]",
                  "border-x-transparent",
                  "border-t-[#d6b94c] dark:border-t-[#8f7927]",
                )}
              />

              {/* Triangle fill */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute -bottom-1.25 left-1 size-0",
                  "border-x-[5px] border-t-[5px]",
                  "border-x-transparent",
                  "border-t-[#fff3a3] dark:border-t-[#3d350f]",
                )}
              />
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      {description ? <p className="text-muted-foreground mt-1 text-xs leading-5">{description}</p> : null}
    </div>
  );
}
