import type { ReactNode } from "react";

export type CiDashboardCardViewModel = {
  id: string;
  route: string;
  label: string;
  description?: string;
  meta?: string;
  badge?: string;
  tone?: "default" | "security" | "success" | "warning";
  icon?: ReactNode;
  className?: string;
  contentClassName?: string;
  iconClassName?: string;
  labelClassName?: string;
  refresh?: boolean;
  removeFocus?: boolean;
  externalTarget?: "_blank" | "_self";
};
