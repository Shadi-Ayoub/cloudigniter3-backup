import "server-only";

import { getTranslations } from "next-intl/server";

import {
  CiDashboardCard,
  CiDashboardGrid,
  ciCapitalizeFirstLetter,
  ciStartTrace,
} from "@cloudigniter/core";

import type { CiResolvedPageConfig } from "@/.";

export type CiDashboardPageProps = {
  config: CiResolvedPageConfig;
  setup: CiDashboardCard[];
};

export async function CiDashboardPage({ config, setup }: CiDashboardPageProps) {
  const t = await getTranslations("dashboard");

  const { logger } = ciStartTrace(
    config.ciConfig.traceLog,
    { source: "server", prettyWave: true },
    { name: "<CiDashboardPage>" },
  );

  logger.log({
    scope: "page",
    event: "Rendering the <CiDashboardPage> component",
  });

  return (
    <CiDashboardGrid>
      {setup.map((card, index) => (
        <CiDashboardCard
          key={card.route ?? index}
          id={index}
          icon={<card.icon />}
          route={card.route}
          label={ciCapitalizeFirstLetter(t(card.label))}
        />
      ))}
    </CiDashboardGrid>
  );
}
