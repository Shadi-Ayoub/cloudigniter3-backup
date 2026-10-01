"use client";

import { TableProperties, Tag } from "lucide-react";
import type { CiDataTableInterface } from "@ci-ui/types";
import { Badge } from "../shadcn/badge";
import { cn } from "../shadcn/lib/utils";

const TITLE_ICON_TONE_CLASSES = {
  primary: "border-primary/30 bg-primary/10 text-primary",
  info: "border-info-border bg-info-surface text-info-surface-foreground",
  success:
    "border-success-border bg-success-surface text-success-surface-foreground",
  warning:
    "border-warning-border bg-warning-surface text-warning-surface-foreground",
  danger:
    "border-danger-border bg-danger-surface text-danger-surface-foreground",
} as const;

/** Shared management-page presentation; keeps table and settings headers aligned. */
export function CiManagementHeader({
  title,
  description,
  titleBadge,
  titleChips,
  titleIcon,
  titleIconTone = "primary",
}: Pick<
  CiDataTableInterface<Record<string, unknown>>,
  | "title"
  | "description"
  | "titleBadge"
  | "titleChips"
  | "titleIcon"
  | "titleIconTone"
>) {
  return (
    <div className="mb-8 flex w-full flex-col gap-5 rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm dark:bg-primary/10 sm:p-6 lg:flex-row lg:items-stretch lg:justify-between">
      <div className="flex min-w-0 flex-1 items-stretch gap-4 sm:gap-5">
        <div
          aria-hidden="true"
          className={cn(
            "flex min-h-24 w-24 shrink-0 items-center justify-center self-stretch rounded-2xl border p-4 [&>svg]:size-16 [&>svg]:shrink-0 sm:w-28",
            TITLE_ICON_TONE_CLASSES[titleIconTone],
          )}
        >
          {titleIcon ?? <TableProperties />}
        </div>
        <div className="min-w-0 self-center py-1">
          {titleBadge ? (
            <div className="mb-2 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
              {titleBadge}
            </div>
          ) : null}
          {title ? (
            <h1 className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
              {title}
            </h1>
          ) : null}
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {titleChips?.length ? (
        <div className="flex flex-wrap content-end items-end gap-2 lg:max-w-sm lg:justify-end lg:self-end">
          {titleChips.map((chip) => (
            <Badge
              key={chip.id}
              variant={
                !chip.variant || chip.variant === "outline"
                  ? "secondary"
                  : chip.variant
              }
            >
              {chip.icon ?? <Tag aria-hidden className="size-3.5" />}
              {chip.label}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
