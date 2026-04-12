import type { ReactNode } from "react";

export type CiDashboardGridProps = {
  children: ReactNode;
};

export function CiDashboardGrid({ children }: CiDashboardGridProps) {
  return (
    <div className="dashboard-container">
      <div className="dashboard-grid">{children}</div>
    </div>
  );
}
