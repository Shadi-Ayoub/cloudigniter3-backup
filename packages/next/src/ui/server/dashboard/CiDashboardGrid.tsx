import { type ReactNode } from "react";

interface CiDashboardGridProps {
  children: ReactNode;
}

export function CiDashboardGrid({ children }: CiDashboardGridProps) {
  return (
    <div className="dashboard-container">
      <div className="dashboard-grid">{children}</div>
    </div>
  );
}
