import type { CiTraceConfig } from "@ci-core/types";
import type { CiDashboardCardConfig } from "./CiDashboardCardConfig";

export type CiDashboardPageProps = {
  traceConfig: CiTraceConfig;
  setup: CiDashboardCardConfig[];
};
