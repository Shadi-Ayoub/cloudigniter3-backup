// CiNextDashboardPage.tsx

import "server-only";

import { getTranslations } from "next-intl/server";
import { ciStartTraceServer } from "@cloudigniter/core/server";
import type { CiNextPageConfig } from "@ci-next/types";
import type { CiDashboardCardProps } from "@cloudigniter/ui/types";

import { CiDashboardPage } from "@cloudigniter/ui/server";

export type CiNextDashboardPageProps = {
  config: CiNextPageConfig;
  setup: CiDashboardCardProps[];
  namespace?: string;
};

export async function CiNextDashboardPage({
  config,
  setup,
  namespace = "dashboard",
}: CiNextDashboardPageProps) {
  const t = await getTranslations(namespace);

  const { logger } = ciStartTraceServer(
    config.coreConfig.dev.traceLog,
    { source: "server", prettyWave: true },
    { name: "<CiNextDashboardPage>" },
  );

  logger.log({
    scope: "page",
    event: "Rendering the <CiNextDashboardPage> component",
  });

  return <CiDashboardPage setup={setup} translate={(key) => t(key)} />;
}
