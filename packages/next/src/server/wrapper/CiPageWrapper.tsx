import type { ReactNode } from "react";
import { ciCanAccessDeveloperTools } from "@cloudigniter/core/lib";
import { ciStartTraceServer } from "@cloudigniter/core/server";
// import { CI_DEV_BEACON_LOGO } from "@cloudigniter/core/lib";
import type { CiI18nConfig, CiSettings } from "@cloudigniter/core/types";
import { ciGetServerLocale } from "@ci-next/server";
// import { CiDevBeacon } from "@ci-next/server";
import type { CiNextContext } from "@ci-next/types";
import { CiClientWrapper } from "@ci-next/client";

interface CloudIgniterClientWrapperInterface {
  context: CiNextContext;
  protect?: boolean;
  children: ReactNode;
}

export async function CiPageWrapper({
  context,
  protect = true,
  children,
}: CloudIgniterClientWrapperInterface) {
  const { logger } = ciStartTraceServer(
    context.config.appCoreConfig.dev.traceLog,
    { source: "server", prettyWave: true },
    { name: "<CiPageWrapper>" },
  );

  logger.log({
    scope: "wrapper",
    event: `Rendering the <CiPageWrapper> component`,
  });

  const locale = await ciGetServerLocale({
    cookieName: context.config.appCoreConfig.i18n.cookieName,
    defaultLocale: context.config.appCoreConfig.i18n.defaultLocale,
  });

  const settings = context.settings as CiSettings;
  const developerToolsEnabled = ciCanAccessDeveloperTools({
    envMode: context.env.mode,
    actor: {
      authenticated: context.auth.user.authenticated,
      roles: context.auth.user.roles,
    },
  });

  if (protect && !settings) {
    throw new Error(`Failed to load system Settings`);
  }

  return (
    <CiClientWrapper
      themeConfig={{
        ...context.config.appCoreConfig.theme,
        themeProviderProps:
          context.config.appNextResolvedConfig.appThemeProviderProps,
      }}
      i18nConfig={context.config.appCoreConfig.i18n as CiI18nConfig}
      devConfig={context.config.appCoreConfig.dev}
      developerToolsEnabled={developerToolsEnabled}
      locale={locale}
      protect={protect}
    >
      {/* <CiDevBeacon
        context={context}
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
      /> */}

      {children}
    </CiClientWrapper>
  );
}
