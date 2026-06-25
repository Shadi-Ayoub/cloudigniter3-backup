import { CI_DEFAULT_TENANT_ROUTING_OPTIONS } from "@cloudigniter/core/lib";
import type {
  CiTenantContext,
  CiTenantResolutionOptions,
  CiTenantRoutingOptions,
} from "@cloudigniter/core/types";

import { ciGetHost, ciLookupTenant, ciResolveTenant } from "./helpers";

import type { NextRequest } from "next/server";

/**
 * Resolves the canonical tenant context for the current request.
 *
 * This function is the single tenant-resolution boundary:
 * - resolves slug/subdomain routing
 * - determines system/global/tenant scope
 * - optionally validates tenant existence/status
 * - returns one normalized context object
 */
export async function ciResolveTenantContext({
  request,
  pathnameNormalized,
  tenantRoutingConfig,
}: {
  request: NextRequest;
  pathnameNormalized: string;
  tenantRoutingConfig: CiTenantRoutingOptions;
}): Promise<CiTenantContext> {
  const tOpts = {
    ...CI_DEFAULT_TENANT_ROUTING_OPTIONS,
    ...(tenantRoutingConfig ?? {}),
  } as Required<CiTenantRoutingOptions>;

  const tenantResolutionOptions: CiTenantResolutionOptions = {
    enabled: tOpts.enabled,
    tenantRoutingMode: tOpts.mode,
    tenantBasePath: tOpts.basePath,
    baseDomain: tOpts.rootDomains,
    tenantHeaderKey: tOpts.idHeaderName,
    scopeHeaderName: tOpts.scopeHeaderName,
    rewriteSubdomainToTenantPath: tOpts.rewriteSubdomainToTenantPath,
  };

  const resolved = ciResolveTenant(
    {
      pathnameNormalized,
      mode: tOpts.mode,
      host: tOpts.mode === "subdomain" ? ciGetHost(request) : undefined,
    },
    tenantResolutionOptions,
  );

  const context: CiTenantContext = {
    id: resolved.id,
    scope: resolved.scope,
    mode: tOpts.mode,
    status: resolved.status ?? "active",
    exists: true,
    pathname: pathnameNormalized,
  };

  /**
   * No lookup is required for system/global routes.
   */
  if (!tOpts.validateTenant || context.scope !== "tenant" || !context.id) {
    return context;
  }

  /**
   * Avoid validating tenant info pages to prevent rewrite loops.
   */
  if (
    pathnameNormalized === tOpts.notFoundPath ||
    pathnameNormalized === tOpts.suspendedPath
  ) {
    return context;
  }

  const lookup = await ciLookupTenant(request, context.id, tOpts);

  if (!lookup.exists) {
    return {
      ...context,
      exists: false,
      status: "active",
    };
  }

  return {
    ...context,
    exists: true,
    status: lookup.status ?? "active",
  };
}
