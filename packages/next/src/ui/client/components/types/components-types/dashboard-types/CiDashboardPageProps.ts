import type { CiTraceConfig } from "@cloudigniter/core/types";
import type { CiDashboardCardConfig } from "./CiDashboardCardConfig";

export type CiDashboardPageProps = {
  traceConfig: CiTraceConfig;
  setup: CiDashboardCardConfig[];
};
