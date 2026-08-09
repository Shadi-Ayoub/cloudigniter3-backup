"use client";

import { useState, type ReactNode } from "react";
import { Info } from "lucide-react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from "@ci-ui/client";
import type { CiDataTableInformation } from "@ci-ui/types";

import {
  ciIsDataTableControlDisabled,
  ciIsDataTableControlVisible,
} from "../lib/ci-data-table-actions";

type CiDataTableInformationControlProps<TData> = {
  row: TData;
  information: CiDataTableInformation<TData>;
};

function resolveRecordNode<TData>(
  value: ReactNode | ((row: TData) => ReactNode) | undefined,
  row: TData
): ReactNode {
  return typeof value === "function" ? value(row) : value;
}

/** Renders the built-in first-position record information control. */
export function CiDataTableInformationControl<TData>({
  row,
  information,
}: CiDataTableInformationControlProps<TData>) {
  const mode = information.mode ?? "tooltip";
  const [tooltipOpen, setTooltipOpen] = useState(false);
  if (!ciIsDataTableControlVisible(information, row)) return null;

  const disabled = ciIsDataTableControlDisabled(information, row);
  const label = information.label ?? "Record information";
  const iconOnly = (information.display ?? "icon") === "icon";
  const button = (
    <Button
      type="button"
      variant="ghost"
      size={iconOnly ? "icon-sm" : "sm"}
      disabled={disabled}
      aria-label={iconOnly ? label : undefined}
      className={cn(iconOnly ? "size-11" : "h-11")}
      onClick={
        mode === "tooltip" ? () => setTooltipOpen((open) => !open) : undefined
      }
    >
      <Info className="size-4" aria-hidden />
      {iconOnly ? null : label}
    </Button>
  );

  if (mode === "dialog") {
    const title = resolveRecordNode(information.title, row) ?? label;
    const description = resolveRecordNode(information.description, row);
    return (
      <Dialog>
        <DialogTrigger asChild>{button}</DialogTrigger>
        <DialogContent
          className={cn("sm:max-w-lg", information.dialogClassName)}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </DialogHeader>
          <div className="min-w-0">
            {resolveRecordNode(information.content, row)}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (disabled) return button;

  return (
    <TooltipProvider>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>
          <span className="inline-flex">{button}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm">
          {resolveRecordNode(information.content, row)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
