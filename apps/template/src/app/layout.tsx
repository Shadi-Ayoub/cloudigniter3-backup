export const dynamic = "force-dynamic"; // disable static optimization
export const revalidate = 0; // no ISR cache

import { type PropsWithChildren } from "react";
import { Inter } from "next/font/google";
import { getLocale } from "next-intl/server";

import { ciGetLangDir } from "@cloudigniter/core/lib";
import { ciStartTraceServer } from "@cloudigniter/core/server";
import { CiNextRootWrapper } from "@cloudigniter/next/server";

import { CiDebugProbe } from "@cloudigniter/core/server";
import { CiDebugProbeProvider } from "@cloudigniter/core/client";

import { Kernel, getConfig } from "@/kernel/server";

import "./globals.css"; // Always after importing Kernel so you can overwrite pre-defined CSS.

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({ children }: PropsWithChildren) {
  const config = getConfig();

  const debugEnabled = config.dev.debug?.enabled === true;

  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    config.dev.traceLog, // your config object (must include enabled: true to activate)
    { source: "server", prettyWave: true }, // per-call overrides
    { name: "RootLayout" }, // optional timer name + base fields
  );
  /////////////////////////////////////////////////////////////////////////////////////////

  const locale = await getLocale();
  const direction = ciGetLangDir(locale);

  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  logger.wave("Application Root Layout Re-rendered");
  logger.log({
    type: "component",
    name: "RootLayout",
    scope: "layout",
    event: `Rendering <RootLayout>: locale=${locale} & direction=${direction}`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body className={`ci-body ${inter.className}`}>
        <CiDebugProbe
          id="root-layout"
          title="Root Layout Debug"
          enabled={debugEnabled}
          data={{
            component: "RootLayout",
            debugEnabled,
            config: {
              loginRoute: config.auth.loginRoute,
              route: config.route,
              data: config.data,
              authenticator: config.auth.authUi,
            },
          }}
        />
        <CiNextRootWrapper config={config}>
          <p>lang={locale}</p>
          <p>dir={direction}</p>
          <p>className={`ci-body ${inter.className}`}</p>
          <p>config={JSON.stringify(config)}</p>
          <Kernel />
          {children}
        </CiNextRootWrapper>
      </body>
    </html>
  );
}
