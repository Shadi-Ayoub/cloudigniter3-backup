import { type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { ciStartTraceServer } from "@cloudigniter/core/server";
import {
  CI_DEV_BEACON_LOGO,
  ciCanAccessDevBeacon,
} from "@cloudigniter/core/lib";
import { CiDebugProbe } from "@cloudigniter/ui/server";
import { CiDevBeacon } from "@ci-next/server";
import type { CiNextRootLayoutContext } from "@ci-next/types";

interface CiNextRootWrapperInterface {
  context: CiNextRootLayoutContext;
  children: ReactNode;
}

/**
 * Server component: fetches fresh locale/messages on every navigation
 * and injects them into NextIntlClientProvider.
 */
export async function CiNextRootWrapper({
  context,
  children,
}: CiNextRootWrapperInterface) {
  /////////////////////////////////////////////////////////////////////////////////////////Initiate Log trace
  const { logger, done } = ciStartTraceServer(
    context.ctx.config.appCoreConfig.dev.traceLog, // your config object (must include enabled: true to activate)
    { source: "server", prettyWave: true }, // per-call overrides
    { name: "CloudIgniterRootWrapper" }, // optional timer name + base fields
  );
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  const locale = context.ctx.config.appResolvedCoreConfig.locale;
  const messages = context.ctx.config.appNextResolvedConfig.messages;

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
    options: context.ctx.config.appCoreConfig.dev?.debug?.devBeacon,
    envMode: context.ctx.env.mode,
    actor: {
      authenticated: context.ctx.auth.user.authenticated,
      roles: context.ctx.auth.user.roles,
    },
  });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {devBeaconAccess ? (
        <CiDevBeacon
          context={context.ctx}
          position="bottom-right"
          visibleWhenEnv={null} // always visible
          defaultTab="status"
          logo={CI_DEV_BEACON_LOGO} // Plain logo spec (client will render next/image)
          extraTabSpecs={[
            {
              kind: "trace-log-text",
              props: { endpoint: "/ci-internal/trace", pollMs: 9000 },
            },
          ]} // Plain tab specs (client will build tabs and render client components)
          viewportTopOffset="120px"
          viewportBottomOffset="0px"
        />
      ) : null}
      <CiDebugProbe {...context.debugProbe} />
      {children}
    </NextIntlClientProvider>
  );
}
