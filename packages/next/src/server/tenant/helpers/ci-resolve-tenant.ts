import type { CiTenantResolutionOptions, CiTenantResolutionResult } from "@cloudigniter/core/types";

import { ciResolveSlugTenant } from "./ci-resolve-slug-tenant";
import { ciResolveSubdomainTenant } from "./ci-resolve-subdomain-tenant";

/**
 * Resolves Tenant routing information using slug- or subdomain-based routing.
 *
 * This performs route resolution only. Resolving the internal Tenant identifier
 * and lifecycle status happens in a subsequent lookup step.
 */
export function ciResolveTenant(
  input: {
    pathnameNormalized: string;
    mode: "slug" | "subdomain";
    host?: string;
  },
  options: CiTenantResolutionOptions,
): CiTenantResolutionResult {
  if (!options.enabled) {
    return {
      scope: "system",
      source: "none",
      featurePathname: input.pathnameNormalized,
    };
  }

  if (input.mode === "slug") {
    return ciResolveSlugTenant(input.pathnameNormalized, options);
  }

  return ciResolveSubdomainTenant(input.host ?? "", input.pathnameNormalized, options);
}
