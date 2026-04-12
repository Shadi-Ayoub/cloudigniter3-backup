import { Card } from "@/ui/components";
import { CiNavigateWithLoader } from "@/navigation";
import type { CiDashboardCardProps } from "../types";

export function CiDashboardCard({
  id,
  route,
  label,
  icon,
  className,
  contentClassName,
  iconClassName,
  labelClassName,
  refresh = false,
  removeFocus = true,
  externalTarget = "_blank",
}: CiDashboardCardProps) {
  return (
    <Card id={id} className={className ?? "dashboard-card"}>
      <CiNavigateWithLoader
        href={route}
        className={contentClassName ?? "dashboard-card-content"}
        refresh={refresh}
        removeFocus={removeFocus}
        externalTarget={externalTarget}
      >
        <span className={iconClassName ?? "dashboard-card-icon"}>{icon}</span>
        <div className={labelClassName ?? "dashboard-card-label"}>{label}</div>
      </CiNavigateWithLoader>
    </Card>
  );
}
