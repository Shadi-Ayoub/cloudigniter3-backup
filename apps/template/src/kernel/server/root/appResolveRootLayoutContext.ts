import { Inter } from "next/font/google";
import { ciStartTraceServer } from "@cloudigniter/core/server";
import type { CiNextRootLayoutContext } from "@cloudigniter/next/types";
import { appBootstrap, appGetDevBeaconActor } from "@/kernel/server";

const inter = Inter({ subsets: ["latin"] });

const version = process.env.NEXT_VERSION;

export async function appResolveRootLayoutContext() {
  const ctx = await appBootstrap();

  const debugProbeEnabled =
    ctx.config.appCoreConfig.dev.debug.debugProbe.enabled === true;

  // ─────────────────────────────────────────────────────────────
  // Log trace
  // ─────────────────────────────────────────────────────────────
  const { logger } = ciStartTraceServer(
    ctx.config.appCoreConfig.dev.traceLog,
    { source: "server", prettyWave: true },
    { name: "RootLayout" },
  );
  // ─────────────────────────────────────────────────────────────

  // const locale = await getLocale();
  // const direction = ciGetLangDir(locale);

  // const envMode = ciGetEnvMode();

  if (!ctx.env.mode) {
    throw new Error("No environment mode is defined.");
  }

  const actor = await appGetDevBeaconActor();

  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  logger.wave("Application Root Layout Re-rendered");
  logger.log({
    type: "component",
    name: "RootLayout",
    scope: "layout",
    event: `Rendering <RootLayout>: locale=${ctx.config.appResolvedCoreConfig.locale} & direction=${ctx.config.appResolvedCoreConfig.direction}`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  const bodyClassName = `ci-body ${inter.className}`;

  const rootLayoutContext: CiNextRootLayoutContext = {
    htmlProps: {
      lang: ctx.config.appResolvedCoreConfig.locale,
      dir: ctx.config.appResolvedCoreConfig.direction,
      suppressHydrationWarning: true,
    },

    bodyProps: {
      className: bodyClassName,
    },

    ctx,

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
        lang: ctx.config.appResolvedCoreConfig.locale,
        dir: ctx.config.appResolvedCoreConfig.direction,
        bodyClassName,
      },
    },
  };

  return rootLayoutContext;
}

// export type AppRootLayoutContext = Awaited<
//   ReturnType<typeof appResolveRootLayoutContext>
// >;
