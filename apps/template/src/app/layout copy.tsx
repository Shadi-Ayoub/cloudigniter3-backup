export const dynamic = "force-dynamic"; // disable static optimization
export const revalidate = 0; // no ISR cache

import { type PropsWithChildren } from "react";
import { Inter } from "next/font/google";
import { getLocale } from "next-intl/server";

import { ciGetLangDir } from "@cloudigniter/core/lib";
import { ciStartTraceServer } from "@cloudigniter/next/server";
import { ciGetEnvMode } from "@cloudigniter/next/server";
import { CiDebugProbe, CiNextRootWrapper } from "@cloudigniter/next/ui/server";

import { appBootstrap, appGetDevBeaconActor, Kernel } from "@/kernel/server";
import "./globals.css"; // Always after importing Kernel so you can overwrite pre-defined CSS.

const inter = Inter({ subsets: ["latin"] });

export default async function AppRootLayout({ children }: PropsWithChildren) {
  const config = await appBootstrap();

  const debugProbeEnabled =
    config.ciConfig.dev.debug.debugProbe.enabled === true;

  // ─────────────────────────────────────────────────────────────
  // Log trace
  // ─────────────────────────────────────────────────────────────
  const { logger } = ciStartTraceServer(
    config.ciConfig.dev.traceLog, // your config object (must include enabled: true to activate)
    { source: "server", prettyWave: true }, // per-call overrides
    { name: "RootLayout" }, // optional timer name + base fields
  );
  // ─────────────────────────────────────────────────────────────

  const locale = await getLocale();
  const direction = ciGetLangDir(locale);

  const envMode = ciGetEnvMode();

  if (!envMode) {
    throw new Error(`No environment mode is defined!!!`);
  }

  const actor = await appGetDevBeaconActor();

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
          title="Root Layout Debug Information"
          options={{
            visible: false,
            x: 40,
            y: 60,
          }}
          enabled={debugProbeEnabled}
          data={{
            component: "RootLayout",
            lang: locale,
            dir: direction,
            bodyClassName: `ci-body ${inter.className}`,
            coreConfig: config.ciConfig,
          }}
        />
        <CiNextRootWrapper config={config} envMode={envMode} actor={actor}>
          <Kernel />
          {children}
        </CiNextRootWrapper>
      </body>
    </html>
  );
}
