import type {
  CiTenantResolutionOptions,
  CiTenantResolutionResult,
} from "@cloudigniter/core/types";

import { ciResolveSlugTenant } from "./ci-resolve-slug-tenant";
import { ciResolveSubdomainTenant } from "./ci-resolve-subdomain-tenant";

/**
 * Resolves tenant information from either slug-based or subdomain-based routing.
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
      status: "active",
      featurePathname: input.pathnameNormalized,
    };
  }

  if (input.mode === "slug") {
    return ciResolveSlugTenant(input.pathnameNormalized, options);
  }

  return ciResolveSubdomainTenant(input.host ?? "", options);
}
