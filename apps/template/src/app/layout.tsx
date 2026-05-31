export const dynamic = "force-dynamic"; // disable static optimization
export const revalidate = 0; // no ISR cache

import { type PropsWithChildren } from "react";
import { Inter } from "next/font/google";
import { getLocale } from "next-intl/server";

import { ciGetLangDir } from "@cloudigniter/core/lib";
import { ciStartTraceServer } from "@cloudigniter/next/server";
import { CiNextRootWrapper } from "@cloudigniter/next/ui/server";

import { CiDebugProbe } from "@cloudigniter/next/ui/server";

import { Kernel, appGetServerCoreConfig } from "@/kernel/server";

import "./globals.css"; // Always after importing Kernel so you can overwrite pre-defined CSS.

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({ children }: PropsWithChildren) {
  const coreConfig = appGetServerCoreConfig();

  const debugEnabled = coreConfig.dev.debug?.enabled === true;

  // ─────────────────────────────────────────────────────────────
  // Log trace
  // ─────────────────────────────────────────────────────────────
  const { logger } = ciStartTraceServer(
    coreConfig.dev.traceLog, // your config object (must include enabled: true to activate)
    { source: "server", prettyWave: true }, // per-call overrides
    { name: "RootLayout" }, // optional timer name + base fields
  );
  // ─────────────────────────────────────────────────────────────

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
          title="Root Layout Debug Information"
          enabled={debugEnabled}
          data={{
            component: "RootLayout",
            lang: locale,
            dir: direction,
            bodyClassName: `ci-body ${inter.className}`,
            coreConfig,
          }}
        />
        <CiNextRootWrapper config={coreConfig}>
          <Kernel />
          {children}
        </CiNextRootWrapper>
      </body>
    </html>
  );
}
