import type { ReactNode } from "react";

export type CiDashboardCardProps = {
  id: string;
  route: string;
  label: string;
  icon?: ReactNode;
  className?: string;
  contentClassName?: string;
  iconClassName?: string;
  labelClassName?: string;
  refresh?: boolean;
  removeFocus?: boolean;
  externalTarget?: "_blank" | "_self";
};
