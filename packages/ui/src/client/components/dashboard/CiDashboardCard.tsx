"use client";

import type { CiDashboardCardProps } from "@ci-ui/types";
import { ArrowUpRight } from "lucide-react";
import { CiIcon } from "@ci-ui/common";

import { CiNavigateWithLoader } from "../../navigation";
import { Card } from "../shadcn";

/** Provider-neutral dashboard card with injectable navigation behavior. */
export function CiDashboardCard({
  id,
  route,
  icon,
  label,
  description,
  meta,
  badge,
  tone = "default",
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
      className={["dashboard-card", `dashboard-card-${tone}`, className]
        .filter(Boolean)
        .join(" ")}
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
        <span className="dashboard-card-topline">
          <span
            className={["dashboard-card-icon", iconClassName]
              .filter(Boolean)
              .join(" ")}
          >
            <CiIcon name={icon} />
          </span>
          {badge ? <span className="dashboard-card-badge">{badge}</span> : null}
          <ArrowUpRight aria-hidden="true" className="dashboard-card-arrow" />
        </span>
        <span
          className={["dashboard-card-label", labelClassName]
            .filter(Boolean)
            .join(" ")}
        >
          {label}
        </span>
        {description ? (
          <span className="dashboard-card-description">{description}</span>
        ) : null}
        {meta ? <span className="dashboard-card-meta">{meta}</span> : null}
      </CiNavigateWithLoader>
    </Card>
  );
}
