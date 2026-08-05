import type { CiTraceConfig } from "@cloudigniter/core/types";

export interface CiDashboardHeaderButtonProps {
  traceConfig: CiTraceConfig;
  refresh?: boolean;
  navigate?: (href: string) => void | Promise<void>;
  refreshRoute?: () => void | Promise<void>;
  onNavigateStart?: (href: string) => void;
}
