import type { CiIconName } from "@cloudigniter/core/types";

export type CiDashboardCardProps = {
  id: string;
  route: string;
  label: string;
  /** Short supporting copy that explains the destination. */
  description?: string;
  /** Optional compact value shown below the description. */
  meta?: string;
  /** Optional status label shown in the card header. */
  badge?: string;
  /** Semantic visual treatment; never used as the only status indicator. */
  tone?: "default" | "security" | "success" | "warning";
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
