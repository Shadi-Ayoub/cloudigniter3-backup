import { type ReactNode } from "react";

import { Card, NavigateWithLoader } from "@Cloudigniter/core";

interface DashboardCardProps {
  id: number;
  icon: ReactNode;
  route: string;
  label: string;
}

export function DashboardCard({ id, route, icon, label }: DashboardCardProps) {
  return (
    <Card id={String(id)} className="dashboard-card">
      <NavigateWithLoader href={route} className="dashboard-card-content">
        <span className="dashboard-card-icon">{icon}</span>
        <div className="dashboard-card-label">{label}</div>
      </NavigateWithLoader>
    </Card>
  );
}
