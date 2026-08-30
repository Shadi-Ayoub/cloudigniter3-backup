"use client";

import { useEffect, useState } from "react";
import {
  CI_DEFAULT_NEW_RESOURCE_BADGE_DURATION_MS,
  ciIsNewResource,
  type CiNewResourceTimestamp,
} from "@cloudigniter/core/lib";

import { Badge, cn } from "../shadcn";

export type CiNewResourceBadgeProps = {
  createdAt: CiNewResourceTimestamp;
  durationMs?: number;
  label?: string;
  className?: string;
};

/** Marks a recently created resource and removes itself when recency expires. */
export function CiNewResourceBadge({
  createdAt,
  durationMs = CI_DEFAULT_NEW_RESOURCE_BADGE_DURATION_MS,
  label = "NEW",
  className,
}: CiNewResourceBadgeProps) {
  // Start hidden so server and browser markup are identical during hydration.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const now = Date.now();
    const isNew = ciIsNewResource(createdAt, { durationMs, now });
    setVisible(isNew);
    if (!isNew) return;

    const createdAtMs =
      createdAt instanceof Date
        ? createdAt.getTime()
        : new Date(createdAt as string | number).getTime();
    const remainingMs = createdAtMs + durationMs - now;
    const timeout = window.setTimeout(
      () => setVisible(false),
      Math.min(remainingMs, 2_147_483_647),
    );
    return () => window.clearTimeout(timeout);
  }, [createdAt, durationMs]);

  if (!visible) return null;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "shrink-0 border-success-border bg-success-surface px-1.5 py-0 text-[0.625rem] font-semibold tracking-wide text-success-surface-foreground",
        className,
      )}
      aria-label="New resource"
      data-ci-new-resource="true"
    >
      {label}
    </Badge>
  );
}
