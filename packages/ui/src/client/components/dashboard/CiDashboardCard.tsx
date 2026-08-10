"use client";

import type { CiDashboardCardProps } from "@ci-ui/types";
import { ArrowUpRight, Info } from "lucide-react";
import { CiIcon } from "@ci-ui/common";

import { CiNavigateWithLoader } from "../../navigation";
import {
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
} from "../shadcn";

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
      className={[
        "dashboard-card relative",
        `dashboard-card-${tone}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <CiNavigateWithLoader
        href={route}
        className={["dashboard-card-content pb-14", contentClassName]
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
      {description ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute end-3 bottom-3 size-11 rounded-full text-muted-foreground hover:text-foreground"
              aria-label={`More information about ${label}`}
            >
              <Info aria-hidden="true" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{label}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            {/* A future user-guide link can be added below the description. */}
          </DialogContent>
        </Dialog>
      ) : null}
    </Card>
  );
}
