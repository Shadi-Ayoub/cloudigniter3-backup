import { ciNormalizePathname } from "@cloudigniter/core/lib";

import type { CiTenantResolutionOptions, CiTenantResolutionResult } from "@cloudigniter/core/types";

import { ciNormalizeRootDomains } from "./ci-normalize-root-domains";
import { ciStripPort } from "./ci-strip-port";

/**
 * Resolves Tenant routing information from subdomain-based URLs.
 *
 * Examples:
 * - acme.example.com/dashboard   -> Tenant slug: acme
 * - global.example.com/dashboard -> Global scope
 * - example.com/dashboard        -> System scope
 *
 * This function performs route resolution only. Resolving the internal Tenant
 * identifier and lifecycle status must happen in a subsequent lookup step.
 */
export function ciResolveSubdomainTenant(
  host: string,
  pathname: string,
  options: CiTenantResolutionOptions,
): CiTenantResolutionResult {
  const normalizedHost = ciStripPort(host);
  const featurePathname = ciNormalizePathname(pathname);

  if (!normalizedHost) {
    return {
      scope: "system",
      source: "none",
      featurePathname,
    };
  }

  const rootDomains = ciNormalizeRootDomains(options.baseDomain ?? []);

  const matchingRootDomain = rootDomains.find(
    (domain) => normalizedHost === domain || normalizedHost.endsWith(`.${domain}`),
  );

  if (!matchingRootDomain) {
    return {
      scope: "system",
      source: "none",
      featurePathname,
    };
  }

  if (normalizedHost === matchingRootDomain) {
    return {
      scope: "system",
      source: "subdomain",
      featurePathname,
    };
  }

  const subdomain = normalizedHost.slice(0, -matchingRootDomain.length).replace(/\.$/, "");

  const firstSubdomainPart = subdomain.split(".")[0];

  if (!firstSubdomainPart) {
    return {
      scope: "system",
      source: "subdomain",
      featurePathname,
    };
  }

  if (firstSubdomainPart === "global") {
    return {
      scope: "global",
      source: "subdomain",
      featurePathname,
    };
  }

  return {
    id: firstSubdomainPart,
    slug: firstSubdomainPart,
    scope: "tenant",
    source: "subdomain",
    featurePathname,
  };
}
