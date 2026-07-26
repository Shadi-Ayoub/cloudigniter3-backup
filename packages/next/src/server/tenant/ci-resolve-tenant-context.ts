import { CI_DEFAULT_TENANT_ROUTING_OPTIONS, ciNormalizePathname } from "@cloudigniter/core/lib";

import type {
  CiResolveTenantContextResult,
  CiTenantContext,
  CiTenantResolutionOptions,
  CiTenantRoutingOptions,
} from "@cloudigniter/core/types";

import { ciGetHost, ciLookupTenant, ciResolveTenant } from "./helpers";

type CiTenantRequest = Pick<Request, "headers" | "url">;

/**
 * Resolves the canonical Tenant context and logical feature pathname for the
 * current request.
 *
 * Route resolution identifies the Tenant slug. When Tenant validation is
 * enabled, the lookup step resolves the internal Tenant identifier and
 * lifecycle information.
 *
 * This function does not create responses, perform informational-page
 * navigation, or serialize CiRequestContext.
 */
export async function ciResolveTenantContext({
  request,
  pathnameNormalized,
  tenantRoutingConfig,
}: {
  /**
   * Active request containing the URL and routing headers.
   */
  request: CiTenantRequest;

  /**
   * Normalized public request pathname.
   */
  pathnameNormalized: string;

  /**
   * Optional Tenant-routing configuration.
   */
  tenantRoutingConfig?: CiTenantRoutingOptions;
}): Promise<CiResolveTenantContextResult> {
  const tenantOptions = {
    ...CI_DEFAULT_TENANT_ROUTING_OPTIONS,
    ...(tenantRoutingConfig ?? {}),
  } as Required<CiTenantRoutingOptions>;

  const tenantResolutionOptions: CiTenantResolutionOptions = {
    enabled: tenantOptions.enabled,
    tenantRoutingMode: tenantOptions.mode,
    tenantBasePath: tenantOptions.basePath,
    baseDomain: tenantOptions.rootDomains,
    rewriteSubdomainToTenantPath: tenantOptions.rewriteSubdomainToTenantPath,
  };

  const resolvedTenant = ciResolveTenant(
    {
      pathnameNormalized,
      mode: tenantOptions.mode,
      host: tenantOptions.mode === "subdomain" ? ciGetHost(request) : undefined,
    },
    tenantResolutionOptions,
  );

  const featurePathname = ciNormalizePathname(resolvedTenant.featurePathname ?? pathnameNormalized);

  const context: CiTenantContext = {
    exists: true,
    ...(resolvedTenant.slug
      ? {
          slug: resolvedTenant.slug,
        }
      : {}),
    scope: resolvedTenant.scope,
    mode: tenantOptions.mode,
    status: "active",
    pathname: pathnameNormalized,
    source: resolvedTenant.source,
  };

  const createResult = (tenant: CiTenantContext): CiResolveTenantContextResult => ({
    tenant,
    featurePathname,
    ...(resolvedTenant.rewritePathname
      ? {
          rewritePathname: resolvedTenant.rewritePathname,
        }
      : {}),
  });

  /**
   * Validation only applies to Tenant-scoped requests containing a resolved
   * route-safe Tenant slug.
   */
  if (!tenantOptions.validateTenant || context.scope !== "tenant" || !context.slug) {
    return createResult(context);
  }

  /**
   * Prevent validation loops when the logical feature pathname already points
   * to a Tenant informational page.
   */
  const tenantInfoPaths = [tenantOptions.notFoundPath, tenantOptions.suspendedPath].map((pathname) =>
    ciNormalizePathname(pathname, { lowercase: true }),
  );

  const featurePathnameNormalized = ciNormalizePathname(featurePathname, {
    lowercase: true,
  });

  // case-insensitive path comparison
  if (tenantInfoPaths.includes(featurePathnameNormalized)) {
    return createResult(context);
  }

  const lookup = await ciLookupTenant(request, context.slug, tenantOptions);

  if (!lookup.exists) {
    return createResult({
      ...context,
      exists: false,
    });
  }

  return createResult({
    ...context,
    exists: true,
    id: lookup.id,
    slug: lookup.slug,
    status: lookup.status,
    ...(lookup.name
      ? {
          name: lookup.name,
        }
      : {}),
    ...(lookup.type
      ? {
          type: lookup.type,
        }
      : {}),
  });
}
