export const dynamic = "force-dynamic"; // disable static optimization
export const revalidate = 0; // no ISR cache

import { type PropsWithChildren } from "react";
import { Inter } from "next/font/google";
// import { getLocale } from "next-intl/server";

// import { ciGetLangDir, ciStartTrace } from "@cloudigniter/core";
// import { CiRootWrapper } from "@cloudigniter/next/server";

// import Kernel, { getConfig } from "@/kernel";

import "./globals.css"; // Always after importing Kernel so you can overwrite pre-defined CSS.

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={`ci-body ${inter.className}`}>{children}</body>
    </html>
  );
}
