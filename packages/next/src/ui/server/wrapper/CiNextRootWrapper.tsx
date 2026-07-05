import { type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import {
  CI_DEV_BEACON_LOGO,
  ciCanAccessDevBeacon,
  ciGetLangDir,
} from "@cloudigniter/core/lib";
import type { CiDevBeaconActor, CiEnvMode } from "@cloudigniter/core/types";
import { CiDevBeacon } from "@ci-next/ui/server";
import { ciStartTraceServer } from "@ci-next/server";
import type { CiNextPageConfig } from "@ci-next/types";

interface CiNextRootWrapperInterface {
  config: CiNextPageConfig;
  envMode: CiEnvMode;
  actor: CiDevBeaconActor;
  children: ReactNode;
}

/**
 * Server component: fetches fresh locale/messages on every navigation
 * and injects them into NextIntlClientProvider.
 */
export async function CiNextRootWrapper({
  config,
  envMode,
  actor,
  children,
}: CiNextRootWrapperInterface) {
  /////////////////////////////////////////////////////////////////////////////////////////Initiate Log trace
  const { logger, done } = ciStartTraceServer(
    config.ciConfig.dev.traceLog, // your config object (must include enabled: true to activate)
    { source: "server", prettyWave: true }, // per-call overrides
    { name: "CloudIgniterRootWrapper" }, // optional timer name + base fields
  );
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  const locale = await getLocale();
  const messages = await getMessages();

  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  done({
    locale: locale,
    message: "locale and language messages are loaded here!",
  });

  logger.log({
    type: "component",
    name: "CloudIgniterRootWrapper",
    scope: "wrapper",
    event: `Rendering <CloudIgniterRootWrapper> & <NextIntlClientProvider> for locale '${locale}'`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const devBeaconAccess = ciCanAccessDevBeacon({
    options: config.ciConfig.dev?.debug?.devBeacon,
    envMode,
    actor,
  });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {devBeaconAccess ? (
        <CiDevBeacon
          locale={locale}
          dir={ciGetLangDir(locale)}
          appPageConfig={config}
          position="bottom-right"
          visibleWhenEnv={null} // always visible
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
      ) : null}
      {children}
    </NextIntlClientProvider>
  );
}
