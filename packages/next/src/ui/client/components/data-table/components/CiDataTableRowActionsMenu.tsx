"use client";

import { Fragment, useMemo } from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  type CiDataTableRowActionsMenuProps,
} from "@ci-next/ui/client";

export function CiDataTableRowActionsMenu<TData>({
  row,
  actions,
  triggerLabel = "⋯",
  className,
  align = "end",
  minWidthClassName = "min-w-[180px]",
}: CiDataTableRowActionsMenuProps<TData>) {
  const visible = useMemo(
    () => actions.filter((a) => (a.isVisible ? a.isVisible(row) : true)),
    [actions, row],
  );

  if (!visible.length) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={["h-8 px-2", className].filter(Boolean).join(" ")}
        >
          {triggerLabel}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} className={minWidthClassName}>
        {visible.map((a, idx) => {
          const disabled = a.isDisabled ? a.isDisabled(row) : false;
          const isDestructive = a.variant === "destructive";

          const shouldSeparate = isDestructive && idx > 0;

          return (
            <Fragment key={a.id}>
              {shouldSeparate ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem
                disabled={disabled}
                onClick={async () => {
                  if (disabled) return;
                  await a.onSelect(row);
                }}
                className={
                  isDestructive
                    ? "text-destructive focus:text-destructive"
                    : undefined
                }
              >
                {a.icon ? (
                  <span className="mr-2 inline-flex">{a.icon}</span>
                ) : null}
                {a.label}
              </DropdownMenuItem>
            </Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
