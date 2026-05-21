import type { CiTraceConfig } from "@/types";
import type { CiDashboardCardConfig } from "./CiDashboardCardConfig";

export type CiDashboardPageProps = {
  traceConfig: CiTraceConfig;
  setup: CiDashboardCardConfig[];
};
