import type { ReactNode } from "react";

import { startTrace } from "@CI/trace";
import { DevBeacon } from "@CI/ui/components/core/server";
import { CI_DEV_BEACON_LOGO } from "@CI/ui/components/core";

import type { CiPageConfig, CiI18nConfig, CiSettings } from "@CI/types";

import { Client } from "./Client";

interface CloudIgniterClientWrapperInterface {
  config: CiPageConfig;
  protect?: boolean;
  children: ReactNode;
}

export function CiPageWrapper({
  config,
  protect = true,
  children,
}: CloudIgniterClientWrapperInterface) {
  const { logger } = startTrace(
    config.ciConfig.traceLog,
    { source: "server", prettyWave: true },
    { name: "<CloudIgniterPageWrapper>" },
  );

  logger.log({
    scope: "wrapper",
    event: `Rendering the <CloudIgniterPageWrapper> component`,
  });

  const settings = config.settings as CiSettings;

  if (protect && !settings) {
    throw new Error(`Failed to load system Settings`);
  }

  return (
    <Client
      theme={{
        ...config.ciConfig.theme,
        themeConfig: config.ciConfig.themeProviderProps,
      }}
      i18n={config.ciConfig.i18n as CiI18nConfig}
      direction={config.ciConfig.direction}
      protect={protect}
    >
      <DevBeacon
        ciPageConfig={config}
        dir="ltr"
        position="bottom-right"
        visibleWhenEnv="sandbox"
        defaultTab="trace"
        // Plain logo spec (client will render next/image)
        logo={CI_DEV_BEACON_LOGO}
        // Plain tab specs (client will build tabs and render client components)
        extraTabSpecs={[
          {
            kind: "trace-log-text",
            props: { endpoint: "/ci-internal/trace", pollMs: 9000 },
          },
        ]}
        viewportTopOffset="120px"
        viewportBottomOffset="0px"
      />

      {children}
    </Client>
  );
}
