"use client";

import React, {
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { MoreHorizontal } from "lucide-react";
import type { CiPageHeaderActionButtonProps } from "@/client";

export function CiPageHeaderActionButton({
  icon,
  onClick,
  ariaLabel,
  title,
  disabled = false,
  ...buttonProps
}: CiPageHeaderActionButtonProps) {
  const renderedIcon: ReactNode = isValidElement(icon)
    ? React.cloneElement(icon as ReactElement<any>, {
        className: `h-4 w-4 ${
          (icon as ReactElement<any>).props?.className ?? ""
        }`.trim(),
        "aria-hidden": true,
      })
    : icon ?? <MoreHorizontal className="h-4 w-4" aria-hidden="true" />;

  return (
    <button
      {...buttonProps}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      className={[
        "hover:bg-muted/10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-transparent p-2 shadow-sm transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95 disabled:opacity-50",
        buttonProps.className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {renderedIcon}
    </button>
  );
}
