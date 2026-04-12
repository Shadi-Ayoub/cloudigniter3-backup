export const dynamic = "force-dynamic"; // disable static optimization
export const revalidate = 0; // no ISR cache

import { type PropsWithChildren } from "react";
import { Inter } from "next/font/google";
import { getLocale } from "next-intl/server";

import { ciStartTrace } from "@cloudigniter/next";
import { CiRootWrapper } from "@cloudigniter/next/server";
import { ciGetLangDir } from "@cloudigniter/core";

import Kernel, { getConfig } from "@/kernel";

import "./globals.css"; // Always after importing Kernel so you can overwrite pre-defined CSS.

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({ children }: PropsWithChildren) {
  const config = getConfig("<RootLayout>");

  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTrace(
    config.traceLog, // your config object (must include enabled: true to activate)
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
        <CiRootWrapper config={config}>
          <Kernel />
          {children}
        </CiRootWrapper>
      </body>
    </html>
  );
}
