import type { PropsWithChildren } from "react";
import CiLayout from "@cloudigniter/next/layout/cp-standard";
import { appBootstrap } from "@/kernel/server";

/**
 * Internal layout root for Tenant-scoped application routes.
 *
 * Public tenant routes are rewritten by proxy/middleware to this route tree.
 *
 * Example:
 * /t/acme/dashboard -> /ci-tenant/dashboard
 */
export default async function CiTenantLayout({ children }: PropsWithChildren) {
  const config = await appBootstrap();
  // throw new Error(`Main Menu Config: ${JSON.stringify(config)}`);
  return <CiLayout config={config}>{children}</CiLayout>;
}
