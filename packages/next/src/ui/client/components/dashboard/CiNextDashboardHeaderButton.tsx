"use client";

import { CiDashboardHeaderButton } from "@cloudigniter/ui/client";
import type { CiDashboardHeaderButtonProps } from "@cloudigniter/ui/types";
import { useCiNextNavigationWithLoader } from "@ci-next/client/navigation";

export type CiNextDashboardHeaderButtonProps = Omit<
  CiDashboardHeaderButtonProps,
  "navigate" | "onNavigateStart" | "refreshRoute"
>;

/** Next.js-aware dashboard link that triggers the shared page loader. */
export function CiNextDashboardHeaderButton(
  props: CiNextDashboardHeaderButtonProps,
) {
  const navigation = useCiNextNavigationWithLoader();

  return <CiDashboardHeaderButton {...props} {...navigation} />;
}
