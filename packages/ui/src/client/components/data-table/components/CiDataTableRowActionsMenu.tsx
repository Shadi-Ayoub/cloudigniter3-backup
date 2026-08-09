"use client";

import { Fragment, useMemo } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@ci-ui/client";
import type { CiDataTableRowActionsMenuProps } from "@ci-ui/types";

import {
  ciIsDataTableControlDisabled,
  ciIsDataTableControlVisible,
} from "../lib/ci-data-table-actions";

export function CiDataTableRowActionsMenu<TData>({
  row,
  actions,
  context,
  triggerLabel,
  triggerAriaLabel = "Row actions",
  className,
  align = "end",
  minWidthClassName = "min-w-[180px]",
}: CiDataTableRowActionsMenuProps<TData>) {
  const visible = useMemo(
    () => actions.filter((a) => ciIsDataTableControlVisible(a, row)),
    [actions, row]
  );

  if (!visible.length) return null;

  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={triggerAriaLabel}
                className={["size-11", className].filter(Boolean).join(" ")}
              >
                {triggerLabel ?? (
                  <MoreHorizontal className="size-4" aria-hidden />
                )}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">{triggerAriaLabel}</TooltipContent>
        </Tooltip>

        <DropdownMenuContent align={align} className={minWidthClassName}>
          {visible.map((a, idx) => {
            const disabled = ciIsDataTableControlDisabled(a, row);
            const isDestructive = a.variant === "destructive";

            const shouldSeparate = isDestructive && idx > 0;

            return (
              <Fragment key={a.id}>
                {shouldSeparate ? <DropdownMenuSeparator /> : null}
                <DropdownMenuItem
                  disabled={disabled}
                  onSelect={async () => {
                    if (disabled) return;
                    await a.onSelect(row, context);
                  }}
                  className={
                    isDestructive
                      ? "text-destructive focus:text-destructive"
                      : undefined
                  }
                >
                  {a.icon ? (
                    <span className="me-2 inline-flex">{a.icon}</span>
                  ) : null}
                  {a.label}
                </DropdownMenuItem>
              </Fragment>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
