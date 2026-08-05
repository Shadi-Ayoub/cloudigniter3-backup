"use client";

import { type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { Info } from "lucide-react";

import { cn, TooltipContent } from "../shadcn";

export type CiTooltipBalloonColor =
  "neutral" | "info" | "success" | "warning" | "danger";

export type CiTooltipBalloonProps = Omit<
  ComponentProps<typeof TooltipContent>,
  "children" | "color" | "content"
> & {
  /** Tooltip body. Null, undefined, and empty strings or arrays render nothing. */
  content?: ReactNode;

  /** Semantic tooltip color. @default "warning" */
  color?: CiTooltipBalloonColor;

  /** CSS z-index value. @default "var(--z-index-tooltip)" */
  zIndex?: CSSProperties["zIndex"];
};

const colorClasses: Record<CiTooltipBalloonColor, string> = {
  neutral: [
    "border-border bg-popover text-popover-foreground",
    "[&_[data-slot=tooltip-arrow-fill]]:fill-popover",
    "[&_[data-slot=tooltip-arrow-border]]:stroke-border",
  ].join(" "),
  info: [
    "border-info-border bg-info-surface text-info-surface-foreground",
    "[&_[data-slot=tooltip-arrow-fill]]:fill-info-surface",
    "[&_[data-slot=tooltip-arrow-border]]:stroke-info-border",
  ].join(" "),
  success: [
    "border-success-border bg-success-surface text-success-surface-foreground",
    "[&_[data-slot=tooltip-arrow-fill]]:fill-success-surface",
    "[&_[data-slot=tooltip-arrow-border]]:stroke-success-border",
  ].join(" "),
  warning: [
    "border-warning-border bg-warning-surface text-warning-surface-foreground",
    "[&_[data-slot=tooltip-arrow-fill]]:fill-warning-surface",
    "[&_[data-slot=tooltip-arrow-border]]:stroke-warning-border",
  ].join(" "),
  danger: [
    "border-danger-border bg-danger-surface text-danger-surface-foreground",
    "[&_[data-slot=tooltip-arrow-fill]]:fill-danger-surface",
    "[&_[data-slot=tooltip-arrow-border]]:stroke-danger-border",
  ].join(" "),
};

const iconColorClasses: Record<CiTooltipBalloonColor, string> = {
  neutral: "text-muted-foreground",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

function ciIsEmptyTooltipContent(content: ReactNode): boolean {
  if (
    content === null ||
    content === undefined ||
    typeof content === "boolean"
  ) {
    return true;
  }

  if (typeof content === "string") {
    return content.trim().length === 0;
  }

  if (Array.isArray(content)) {
    return content.every(ciIsEmptyTooltipContent);
  }

  return false;
}

/** Shared application tooltip balloon with semantic colors and a side-aware arrow. */
export function CiTooltipBalloon({
  content,
  color = "warning",
  zIndex,
  side = "top",
  align = "center",
  sideOffset = 6,
  showArrow = true,
  className,
  style,
  ...tooltipContentProps
}: CiTooltipBalloonProps) {
  if (ciIsEmptyTooltipContent(content)) {
    return null;
  }

  return (
    <TooltipContent
      {...tooltipContentProps}
      side={side}
      align={align}
      sideOffset={sideOffset}
      showArrow={showArrow}
      className={cn(
        "relative max-w-72 overflow-visible border px-3 py-2 text-xs leading-relaxed shadow-md",
        colorClasses[color],
        className,
      )}
      style={{
        ...style,
        zIndex: zIndex ?? style?.zIndex ?? "var(--z-index-tooltip)",
      }}
    >
      <div className="flex items-start gap-2">
        <Info
          className={cn("mt-0.5 size-3.5 shrink-0", iconColorClasses[color])}
          aria-hidden="true"
        />

        <div className="min-w-0">
          {typeof content === "string" ? <p>{content}</p> : content}
        </div>
      </div>
    </TooltipContent>
  );
}
