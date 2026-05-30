"use client";

import { useEffect } from "react";
import {
  ciGetLangDir,
  ciParseServerErrorPayload,
} from "@cloudigniter/core/lib";
import { ciGetCookie } from "@cloudigniter/core/client";
import {
  CiErrorPage,
  CiPageLoader,
  useCiPageLoaderStore,
} from "@cloudigniter/next/ui/client";
import { Inter } from "next/font/google";
import type { CiNextAwsCoreConfig } from "@/kernel/types";
import "@cloudigniter/next/styles/standard/style.css";

import ciConfig from "@/../cloudigniter.config";

// import Kernel from '@/kernel';
import "./globals.css"; // Always after importing Kernel

// const config = ciConfig as CiNextAwsCoreConfig;

const config = ciConfig as CiNextAwsCoreConfig;

const inter = Inter({ subsets: ["latin"] });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { setLoading } = useCiPageLoaderStore();

  useEffect(() => {
    // Hook up to your logger/Sentry/etc.
    console.error("App Error:", error);
  }, [error]);

  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  const parsed = ciParseServerErrorPayload(error);
  const cookieName = config.i18n.cookieName ?? "ci-locale";
  const locale = ciGetCookie(cookieName) ?? "en";
  const direction = ciGetLangDir(locale);

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body className={`ci-body ${inter.className}`}>
        <main className="ci-viewport-center">
          {/* <Kernel /> */}
          <CiErrorPage
            title={parsed.title}
            message={parsed.message}
            severity={parsed.severity}
            showRetry={parsed.showRetry}
            onRetry={reset} // soft retry via Next.js
          />
          <CiPageLoader />
        </main>
      </body>
    </html>
  );
}
