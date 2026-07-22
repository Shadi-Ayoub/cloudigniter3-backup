import type { CiIconName } from "@cloudigniter/core/types";

export type CiDashboardCardProps = {
  id: string;
  route: string;
  label: string;
  icon: CiIconName;
  className?: string;
  contentClassName?: string;
  iconClassName?: string;
  labelClassName?: string;
  namespace?: string;
  refresh?: boolean;
  removeFocus?: boolean;
  externalTarget?: "_blank" | "_self";
  setup?: boolean;
};
