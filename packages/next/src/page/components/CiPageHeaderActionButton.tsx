"use client";

import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import React from "react";
import { MoreHorizontal } from "lucide-react";

export interface PageHeaderActionButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  icon?: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  /** Accessible label; required if the icon has no visible text equivalent */
  ariaLabel?: string;
  /** Tooltip/title shown on hover */
  title?: string;
  disabled?: boolean;
}

export function CiPageHeaderActionButton({
  icon,
  onClick,
  ariaLabel,
  title,
  disabled = false,
}: PageHeaderActionButtonProps) {
  // Normalize the icon: if user passed a React element, ensure it has default sizing
  const renderedIcon =
    icon && typeof icon === "object" && (icon as any).type ? (
      // clone to merge default size if not provided
      ((): ReactNode => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const element = icon as any;
        const existingClass = element.props?.className || "";
        return (
          // clone with merged className to ensure consistent size
          React.cloneElement(element, {
            className: `h-4 w-4 ${existingClass} aria-hidden': true`,
          })
        );
      })()
    ) : (
      // fallback default icon
      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
    );

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      className={
        "hover:bg-muted/10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-transparent p-2 shadow-sm transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95 disabled:opacity-50"
      }
    >
      {renderedIcon}
    </button>
  );
}
