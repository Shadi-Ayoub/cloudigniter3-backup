"use client";

import { CiDashboardCard } from "@cloudigniter/ui/client";
import type { CiDashboardCardProps } from "@cloudigniter/ui/types";
import { useCiNextNavigationWithLoader } from "@ci-next/client/navigation";

export type CiNextDashboardCardProps = Omit<
  CiDashboardCardProps,
  "navigate" | "onNavigateStart" | "refreshRoute"
>;

/** Next.js-aware dashboard card that triggers the shared page loader. */
export function CiNextDashboardCard(props: CiNextDashboardCardProps) {
  const navigation = useCiNextNavigationWithLoader();

  return <CiDashboardCard {...props} {...navigation} />;
}
