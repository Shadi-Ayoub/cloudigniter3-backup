import type { PropsWithChildren } from "react";
import CiLayout from "@cloudigniter/next/layout/cp-standard";
import { appBootstrap } from "@/kernel/server";

/**
 * Internal layout root for Global-scoped application routes.
 *
 * Public global routes are rewritten by proxy/middleware to this route tree.
 *
 * Example:
 * /t/global/dashboard -> /ci-global/dashboard
 */
export default async function CiGlobalLayout({ children }: PropsWithChildren) {
  const config = await appBootstrap();
  // throw new Error(`Main Menu Config: ${JSON.stringify(config)}`);
  return <CiLayout config={config}>{children}</CiLayout>;
}
