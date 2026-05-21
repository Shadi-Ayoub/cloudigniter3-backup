import "server-only";
import { getTranslations } from "next-intl/server";
import { ciStartTrace } from "@cloudigniter/core";
import { ciCapitalizeFirstLetter } from "@cloudigniter/core/helpers";
import { type CiDashboardCardProps as CiDashboardCardType } from "@cloudigniter/core/client";
import { CiDashboardCard, CiDashboardGrid } from "@/ui";
import type { CiNextPageConfig } from "@/page";

export type CiDashboardPageProps = {
  config: CiNextPageConfig;
  setup: CiDashboardCardType[];
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
          id={String(index)}
          icon={card.icon}
          route={card.route}
          label={ciCapitalizeFirstLetter(t(card.label))}
        />
      ))}
    </CiDashboardGrid>
  );
}
