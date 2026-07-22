import { CiNavigateWithLoader } from "@ci-ui/client";
import type { CiDashboardCardProps } from "@ci-ui/types";
import { CiIcon } from "@ci-ui/common";
import { Card } from "../../client";

export function CiDashboardCard({
  id,
  route,
  icon,
  label,
}: CiDashboardCardProps) {
  return (
    <Card id={String(id)} className="dashboard-card">
      <CiNavigateWithLoader href={route} className="dashboard-card-content">
        <span className="dashboard-card-icon">
          <CiIcon name={icon} />
        </span>
        <div className="dashboard-card-label">{label}</div>
      </CiNavigateWithLoader>
    </Card>
  );
}
