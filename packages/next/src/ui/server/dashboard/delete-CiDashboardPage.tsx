// import "server-only";

import { getTranslations } from "next-intl/server";
import { ciStartTraceServer } from "@ci-next/server";
import {
  ciResolveDashboardCardViewModels,
  type CiDashboardPageProps,
} from "@ci-next/ui/client";
import { CiDashboardCard } from "./CiDashboardCard";
import { CiDashboardGrid } from "./CiDashboardGrid";

export async function CiDashboardPage({
  traceConfig,
  setup,
}: CiDashboardPageProps) {
  const t = await getTranslations("dashboard");

  const { logger } = ciStartTraceServer(
    traceConfig,
    { source: "server", prettyWave: true },
    { name: "<CiDashboardPage>" },
  );

  logger.log({
    scope: "page",
    event: "Rendering the <CiDashboardPage> component",
  });

  const ciCards = ciResolveDashboardCardViewModels(setup, {
    translate: (label) => t(label),
    capitalizeLabel: true,
  });

  return (
    <CiDashboardGrid>
      {ciCards.map((card) => (
        <CiDashboardCard
          key={card.id}
          id={card.id}
          route={card.route}
          label={card.label}
          icon={card.icon}
          // className={card.className}
          // contentClassName={card.contentClassName}
          // iconClassName={card.iconClassName}
          // labelClassName={card.labelClassName}
          // refresh={card.refresh}
          // removeFocus={card.removeFocus}
          // externalTarget={card.externalTarget}
        />
      ))}
    </CiDashboardGrid>
  );
}
