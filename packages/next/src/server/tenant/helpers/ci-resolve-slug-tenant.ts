import { ciNormalizePathname } from "@cloudigniter/core/lib";

import type {
  CiTenantResolutionOptions,
  CiTenantResolutionResult,
} from "@cloudigniter/core/types";

import { ciNormalizeBasePath } from "./ci-normalize-base-path";

/**
 * Resolves tenant from slug-based URLs.
 *
 * Examples when tenantBasePath is "/tx":
 * - /tx/acme/dashboard  -> tenant: acme
 * - /tx/global/dashboard -> global scope
 * - /dashboard           -> system scope
 */
export function ciResolveSlugTenant(
  pathname: string,
  options: CiTenantResolutionOptions,
): CiTenantResolutionResult {
  const pathnameNormalized = ciNormalizePathname(pathname);
  const basePath = ciNormalizeBasePath(options.tenantBasePath);

  if (!pathnameNormalized.startsWith(`${basePath}/`)) {
    return {
      scope: "system",
      source: "none",
      status: "active",
      featurePathname: pathnameNormalized,
    };
  }

  const segments = pathnameNormalized
    .slice(basePath.length)
    .split("/")
    .filter(Boolean);

  const candidate = segments[0];

  if (!candidate) {
    return {
      scope: "system",
      source: "none",
      status: "active",
      featurePathname: pathnameNormalized,
    };
  }

  const featurePathname = ciNormalizePathname(
    `/${segments.slice(1).join("/")}`,
  );

  if (candidate === "global") {
    return {
      scope: "global",
      source: "slug",
      status: "active",
      featurePathname,
    };
  }

  return {
    id: candidate,
    scope: "tenant",
    source: "slug",
    status: "active",
    featurePathname,
  };
}
