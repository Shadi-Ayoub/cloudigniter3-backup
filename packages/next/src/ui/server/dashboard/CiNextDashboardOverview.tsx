import type { ReactNode } from "react";
import type { CiDashboardCardProps } from "@cloudigniter/ui/types";
import { CiDashboardPage } from "@cloudigniter/ui/server";
import { CiNextDashboardCard } from "@ci-next/ui/client";

export type CiNextDashboardOverviewProps = {
  setup: CiDashboardCardProps[];
  eyebrow?: string;
  title?: string;
  description?: string;
  aside?: ReactNode;
};

/** Next.js-aware composition for a rich dashboard overview. */
export function CiNextDashboardOverview({
  setup,
  eyebrow,
  title,
  description,
  aside,
}: CiNextDashboardOverviewProps) {
  return (
    <CiDashboardPage
      setup={setup}
      eyebrow={eyebrow}
      title={title}
      description={description}
      aside={aside}
      renderCard={(card) => <CiNextDashboardCard {...card} />}
    />
  );
}
