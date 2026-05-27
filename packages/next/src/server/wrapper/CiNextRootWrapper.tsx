import { type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import { ciStartTraceServer } from "@cloudigniter/core/server";
import { type CiCoreConfig } from "@cloudigniter/core/types";

interface CiNextRootWrapperInterface {
  config: CiCoreConfig;
  children: ReactNode;
}

/**
 * Server component: fetches fresh locale/messages on every navigation
 * and injects them into NextIntlClientProvider.
 */
export async function CiNextRootWrapper({
  config,
  children,
}: CiNextRootWrapperInterface) {
  /////////////////////////////////////////////////////////////////////////////////////////Initiate Log trace
  const { logger, done } = ciStartTraceServer(
    config.dev.traceLog, // your config object (must include enabled: true to activate)
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

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
