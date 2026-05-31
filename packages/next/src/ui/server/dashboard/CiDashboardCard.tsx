import { type ReactNode } from "react";
import { Card } from "../../client";
import { CiNavigateWithLoader } from "../../../client";

interface DashboardCardProps {
  id: string;
  icon: ReactNode;
  route: string;
  label: string;
}

export function CiDashboardCard({
  id,
  route,
  icon,
  label,
}: DashboardCardProps) {
  return (
    <Card id={String(id)} className="dashboard-card">
      <CiNavigateWithLoader href={route} className="dashboard-card-content">
        <span className="dashboard-card-icon">{icon}</span>
        <div className="dashboard-card-label">{label}</div>
      </CiNavigateWithLoader>
    </Card>
  );
}
