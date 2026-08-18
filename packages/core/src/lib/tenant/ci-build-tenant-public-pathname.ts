import type { CiBuildTenantPublicPathnameInput } from "@ci-core/types";

import { ciNormalizePathname } from "../general";
import { CI_DEFAULT_TENANT_BASE_PATH } from "./constants";

function ciNormalizeTenantBasePath(value: string): string {
  const normalized = ciNormalizePathname(value);

  return normalized === "/" ? "" : normalized;
}

/**
 * Builds the browser-visible pathname for a logical feature route.
 *
 * Slug routing prefixes Tenant and Global paths. Subdomain routing keeps the
 * feature pathname unchanged because the Tenant is carried by the host.
 */
export function ciBuildTenantPublicPathname({
  featurePathname,
  tenant,
  tenantBasePath = CI_DEFAULT_TENANT_BASE_PATH,
}: CiBuildTenantPublicPathnameInput): string {
  const normalizedFeaturePathname = ciNormalizePathname(featurePathname);

  if (tenant.scope === "system" || tenant.mode === "subdomain") {
    return normalizedFeaturePathname;
  }

  const tenantSegment =
    tenant.scope === "global" ? "global" : tenant.slug?.trim();

  if (!tenantSegment || tenantSegment.includes("/")) {
    throw new TypeError(
      "A Tenant-scoped public pathname requires a route-safe Tenant slug.",
    );
  }

  const basePath = ciNormalizeTenantBasePath(tenantBasePath);
  const featureSuffix =
    normalizedFeaturePathname === "/" ? "" : normalizedFeaturePathname;

  return ciNormalizePathname(`${basePath}/${tenantSegment}${featureSuffix}`);
}
