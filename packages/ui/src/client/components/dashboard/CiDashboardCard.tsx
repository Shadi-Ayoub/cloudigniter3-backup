"use client";

import type { CiDashboardCardProps } from "@ci-ui/types";
import { CiIcon } from "@ci-ui/common";

import { CiNavigateWithLoader } from "../../navigation";
import { Card } from "../shadcn";

/** Provider-neutral dashboard card with injectable navigation behavior. */
export function CiDashboardCard({
  id,
  route,
  icon,
  label,
  className,
  contentClassName,
  iconClassName,
  labelClassName,
  refresh,
  removeFocus,
  externalTarget,
  navigate,
  refreshRoute,
  onNavigateStart,
}: CiDashboardCardProps) {
  return (
    <Card
      id={String(id)}
      className={["dashboard-card", className].filter(Boolean).join(" ")}
    >
      <CiNavigateWithLoader
        href={route}
        className={["dashboard-card-content", contentClassName]
          .filter(Boolean)
          .join(" ")}
        refresh={refresh}
        removeFocus={removeFocus}
        externalTarget={externalTarget}
        navigate={navigate}
        refreshRoute={refreshRoute}
        onNavigateStart={onNavigateStart}
      >
        <span
          className={["dashboard-card-icon", iconClassName]
            .filter(Boolean)
            .join(" ")}
        >
          <CiIcon name={icon} />
        </span>
        <div
          className={["dashboard-card-label", labelClassName]
            .filter(Boolean)
            .join(" ")}
        >
          {label}
        </div>
      </CiNavigateWithLoader>
    </Card>
  );
}
