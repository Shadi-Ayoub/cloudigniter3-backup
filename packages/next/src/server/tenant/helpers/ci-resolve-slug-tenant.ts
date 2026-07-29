import { ciNormalizePathname } from "@cloudigniter/core/lib";

import type { CiTenantResolutionOptions, CiTenantResolutionResult } from "@cloudigniter/core/types";

import { ciNormalizeBasePath } from "./ci-normalize-base-path";

/**
 * Resolves Tenant routing information from slug-based URLs.
 *
 * Examples when tenantBasePath is "/tx":
 * - /tx/acme/dashboard    -> Tenant slug: acme
 * - /tx/global/dashboard -> Global scope
 * - /dashboard           -> System scope
 *
 * This function performs route resolution only. Resolving the internal Tenant
 * identifier and lifecycle status must happen in a subsequent lookup step.
 */
export function ciResolveSlugTenant(pathname: string, options: CiTenantResolutionOptions): CiTenantResolutionResult {
  const pathnameNormalized = ciNormalizePathname(pathname);
  const basePath = ciNormalizeBasePath(options.tenantBasePath);

  if (!pathnameNormalized.startsWith(`${basePath}/`)) {
    return {
      scope: "system",
      source: "none",
      featurePathname: pathnameNormalized,
    };
  }

  const segments = pathnameNormalized.slice(basePath.length).split("/").filter(Boolean);

  const candidate = segments[0];

  if (!candidate) {
    return {
      scope: "system",
      source: "none",
      featurePathname: pathnameNormalized,
    };
  }

  const featurePathname = ciNormalizePathname(`/${segments.slice(1).join("/")}`);

  if (candidate === "global") {
    return {
      scope: "global",
      source: "slug",
      featurePathname,
    };
  }

  return {
    id: candidate,
    slug: candidate,
    scope: "tenant",
    source: "slug",
    featurePathname,
  };
}
