import { Inter } from "next/font/google";
import { getLocale } from "next-intl/server";

import { ciGetLangDir } from "@cloudigniter/core/lib";
import { ciGetEnvMode, ciStartTraceServer } from "@cloudigniter/next/server";

import { appBootstrap, appGetDevBeaconActor } from "@/kernel/server";

const inter = Inter({ subsets: ["latin"] });

export async function appResolveRootLayoutContext() {
  const config = await appBootstrap();

  const debugProbeEnabled =
    config.ciConfig.dev.debug.debugProbe.enabled === true;

  // ─────────────────────────────────────────────────────────────
  // Log trace
  // ─────────────────────────────────────────────────────────────
  const { logger } = ciStartTraceServer(
    config.ciConfig.dev.traceLog,
    { source: "server", prettyWave: true },
    { name: "RootLayout" },
  );
  // ─────────────────────────────────────────────────────────────

  const locale = await getLocale();
  const direction = ciGetLangDir(locale);

  const envMode = ciGetEnvMode();

  if (!envMode) {
    throw new Error("No environment mode is defined.");
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

  const bodyClassName = `ci-body ${inter.className}`;

  return {
    htmlProps: {
      lang: locale,
      dir: direction,
      suppressHydrationWarning: true,
    },

    bodyProps: {
      className: bodyClassName,
    },

    config,
    envMode,
    actor,

    debugProbe: {
      id: "root-layout",
      title: "Root Layout Debug Information",
      enabled: debugProbeEnabled,
      options: {
        visible: false,
        x: 40,
        y: 60,
      },
      data: {
        component: "RootLayout",
        lang: locale,
        dir: direction,
        bodyClassName,
        coreConfig: config.ciConfig,
      },
    },
  } as const;
}

export type AppRootLayoutContext = Awaited<
  ReturnType<typeof appResolveRootLayoutContext>
>;
