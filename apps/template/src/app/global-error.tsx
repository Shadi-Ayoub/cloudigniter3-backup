"use client";

import { useEffect } from "react";
import { ciParseServerErrorPayload } from "@cloudigniter/core";
import { ErrorPage, PageLoader } from "@cloudigniter/next/ui/layout";
import { Inter } from "next/font/google";

import { getLangDir } from "@cloudigniter/next/utility";
import { getCookie } from "@cloudigniter/next/utility/client";
import { usePageLoader } from "@CI/store/page-loader";
import type { Config } from "@cloudigniter/next/types";

import "@cloudigniter/next/styles/standard.css";

import ciConfig from "@/../cloudigniter.config";

// import Kernel from '@/kernel';
import "./globals.css"; // Always after importing Kernel

const config = ciConfig as Config;

const inter = Inter({ subsets: ["latin"] });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { setLoading } = usePageLoader();

  useEffect(() => {
    // Hook up to your logger/Sentry/etc.
    console.error("App Error:", error);
  }, [error]);

  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  const parsed = ciParseServerErrorPayload(error);
  const cookieName = config.i18n.cookieName ?? "ci-locale";
  const locale = getCookie(cookieName) ?? "en";
  const direction = getLangDir(locale);

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body className={`ci-body ${inter.className}`}>
        <main className="ci-viewport-center">
          {/* <Kernel /> */}
          <ErrorPage
            title={parsed.title}
            message={parsed.message}
            severity={parsed.severity}
            showRetry={parsed.showRetry}
            onRetry={reset} // soft retry via Next.js
          />
          <PageLoader />
        </main>
      </body>
    </html>
  );
}
