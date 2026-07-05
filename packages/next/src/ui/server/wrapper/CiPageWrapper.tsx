import type { ReactNode } from "react";
import { CI_DEV_BEACON_LOGO } from "@cloudigniter/core/lib";
import { ciGetServerLocale, ciStartTraceServer } from "../../../server";
import type { CiI18nConfig, CiSettings } from "@cloudigniter/core/types";
import { CiDevBeacon } from "../../server";

import type { CiNextPageConfig } from "../../../types";

import { CiClientWrapper } from "../../../client";

interface CloudIgniterClientWrapperInterface {
  config: CiNextPageConfig;
  protect?: boolean;
  children: ReactNode;
}

export async function CiPageWrapper({
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

  const locale = await ciGetServerLocale({
    cookieName: config.ciConfig.i18n.cookieName,
    defaultLocale: config.ciConfig.i18n.defaultLocale,
  });

  const settings = config.settings as CiSettings;

  if (protect && !settings) {
    throw new Error(`Failed to load system Settings`);
  }

  return (
    <CiClientWrapper
      themeConfig={{
        ...config.ciConfig.theme,
        themeProviderProps: config.ciConfig.themeProviderProps,
      }}
      i18nConfig={config.ciConfig.i18n as CiI18nConfig}
      devConfig={config.ciConfig.dev}
      locale={locale}
      protect={protect}
    >
      <CiDevBeacon
        appPageConfig={config}
        locale={locale.code}
        dir={locale.direction}
        position="bottom-right"
        visibleWhenEnv="development"
        defaultTab="status"
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
