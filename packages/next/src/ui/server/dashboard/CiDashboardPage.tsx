// import "server-only";
import { getTranslations } from "next-intl/server";
import { ciCapitalizeFirstLetter } from "@cloudigniter/core/lib";
import { ciStartTraceServer } from "../../../server";
import { type CiDashboardCardProps as CiDashboardCardType } from "../../client";
import type { CiNextPageConfig } from "../../../types";
import { CiDashboardCard } from "./CiDashboardCard";
import { CiDashboardGrid } from "./CiDashboardGrid";

export type CiDashboardPageProps = {
  config: CiNextPageConfig;
  setup: CiDashboardCardType[];
};

export async function CiDashboardPage({ config, setup }: CiDashboardPageProps) {
  const t = await getTranslations("dashboard");

  const { logger } = ciStartTraceServer(
    config.ciConfig.dev.traceLog,
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
          id={card.id}
          icon={card.icon}
          route={card.route}
          label={ciCapitalizeFirstLetter(t(card.label))}
        />
      ))}
    </CiDashboardGrid>
  );
}
