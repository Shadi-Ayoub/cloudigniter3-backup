import { type ReactNode } from "react";

interface CiDashboardGridProps {
  children: ReactNode;
  className?: string;
}

/** Responsive grid used by dashboard and administration overview pages. */
export function CiDashboardGrid({ children, className }: CiDashboardGridProps) {
  return (
    <div className="dashboard-container">
      <div className={["dashboard-grid", className].filter(Boolean).join(" ")}>
        {children}
      </div>
    </div>
  );
}
