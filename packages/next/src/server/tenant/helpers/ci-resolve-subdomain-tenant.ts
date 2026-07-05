import type {
  CiTenantResolutionOptions,
  CiTenantResolutionResult,
} from "@cloudigniter/core/types";
import { ciNormalizeRootDomains } from "./ci-normalize-root-domains";
import { ciStripPort } from "./ci-strip-port";

/**
 * Resolves tenant from subdomain-based URLs.
 *
 * Example:
 * - acme.example.com -> tenant: acme
 * - example.com      -> system scope
 */
export function ciResolveSubdomainTenant(
  host: string,
  options: CiTenantResolutionOptions,
): CiTenantResolutionResult {
  const normalizedHost = ciStripPort(host);

  if (!normalizedHost) {
    return {
      source: "subdomain",
      scope: "system",
      status: "active",
    };
  }

  const rootDomains = ciNormalizeRootDomains(options.baseDomain ?? []);

  const matchingRootDomain = rootDomains.find((domain) => {
    return normalizedHost === domain || normalizedHost.endsWith(`.${domain}`);
  });

  if (!matchingRootDomain) {
    return {
      source: "subdomain",
      scope: "system",
      status: "active",
    };
  }

  if (normalizedHost === matchingRootDomain) {
    return {
      source: "subdomain",
      scope: "system",
      status: "active",
    };
  }

  const subdomain = normalizedHost
    .slice(0, -matchingRootDomain.length)
    .replace(/\.$/, "");

  const firstSubdomainPart = subdomain.split(".")[0];

  if (!firstSubdomainPart) {
    return {
      source: "subdomain",
      scope: "system",
      status: "active",
    };
  }

  if (firstSubdomainPart === "global") {
    return {
      source: "subdomain",
      scope: "global",
      status: "active",
    };
  }

  return {
    id: firstSubdomainPart,
    source: "subdomain",
    scope: "tenant",
    status: "active",
  };
}
