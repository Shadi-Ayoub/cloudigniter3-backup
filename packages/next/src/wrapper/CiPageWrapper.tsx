import type { ReactNode } from "react";
import { CI_DEV_BEACON_LOGO } from "@cloudigniter/core/lib";
import { ciStartTraceServer } from "@ci-next/server";
import type { CiI18nConfig, CiSettings } from "@cloudigniter/core/types";
import { CiDevBeacon } from "@ci-next/server";

import type { CiNextPageConfig } from "@ci-next/types";

import { CiClientWrapper } from "@ci-next/client";

interface CloudIgniterClientWrapperInterface {
  config: CiNextPageConfig;
  protect?: boolean;
  children: ReactNode;
}

export function CiPageWrapper({
  config,
  protect = true,
  children,
}: CloudIgniterClientWrapperInterface) {
  const { logger } = ciStartTraceServer(
    config.ciConfig.dev.traceLog,
    { source: "server", prettyWave: true },
    { name: "<CiPageWrapper>" },
  );

  logger.log({
    scope: "wrapper",
    event: `Rendering the <CiPageWrapper> component`,
  });

  const settings = config.settings as CiSettings;

  if (protect && !settings) {
    throw new Error(`Failed to load system Settings`);
  }

  return (
    <CiClientWrapper
      theme={{
        ...config.ciConfig.theme,
        themeProviderProps: config.ciConfig.themeProviderProps,
      }}
      i18n={config.ciConfig.i18n as CiI18nConfig}
      direction={config.ciConfig.direction}
      protect={protect}
    >
      <CiDevBeacon
        corePageConfig={config}
        dir="ltr"
        position="bottom-right"
        visibleWhenEnv="development"
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
    </CiClientWrapper>
  );
}
