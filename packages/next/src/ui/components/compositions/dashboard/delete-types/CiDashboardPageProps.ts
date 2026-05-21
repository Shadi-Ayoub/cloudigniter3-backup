import type { CiNextPageConfig } from "@/page";
import type { CiDashboardCardConfig } from "./CiDashboardCardConfig";

export type CiDashboardPageProps = {
  config: CiNextPageConfig;
  setup: CiDashboardCardConfig[];
};
