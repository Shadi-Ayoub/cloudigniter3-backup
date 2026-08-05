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
  navigate?: (href: string) => void | Promise<void>;
  refreshRoute?: () => void | Promise<void>;
  onNavigateStart?: (href: string) => void;
  setup?: boolean;
};
