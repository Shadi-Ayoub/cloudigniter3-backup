import type { CiResolvedPageConfig } from "@/.";
import type { CiDashboardCardConfig } from "./CiDashboardCardConfig";

export type CiDashboardPageProps = {
  config: CiResolvedPageConfig;
  setup: CiDashboardCardConfig[];
};
