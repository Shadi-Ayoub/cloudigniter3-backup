export const dynamic = "force-dynamic"; // disable static optimization
export const revalidate = 0; // no ISR cache

import type { PropsWithChildren } from "react";

import { AppRootWrapper, appResolveRootLayoutContext } from "@/kernel/server";
import "./globals.css"; // Always after importing AppRootWrapper so you can overwrite pre-defined CSS.

export default async function AppRootLayout({ children }: PropsWithChildren) {
  const root = await appResolveRootLayoutContext();

  return (
    <html {...root.htmlProps}>
      <body {...root.bodyProps}>
        <AppRootWrapper root={root}>{children}</AppRootWrapper>
      </body>
    </html>
  );
}
