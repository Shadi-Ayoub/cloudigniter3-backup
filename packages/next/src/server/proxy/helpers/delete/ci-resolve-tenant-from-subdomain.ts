import type { CiTenantScope } from "@cloudigniter/core/types";

/**
 * Resolves tenant context from a host string via subdomain extraction.
 *
 * Expected structure:
 * - With baseDomain validation:
 *     {tenantId}.{rootDomain}
 *
 *   Where `rootDomain` MUST match one of the configured base domains.
 *
 *   Example:
 *     baseDomains = ["example.com", "example.ae"]
 *
 *     "schoola.example.com" → tenantId = "schoola"
 *     "schoolb.example.ae"  → tenantId = "schoolb"
 *
 * - Without baseDomain:
 *   CiTenant is inferred conservatively from the left-most label, but ONLY when
 *   the host contains at least three labels (a.b.c).
 *
 * Scope semantics:
 * - Successful extraction ALWAYS implies tenant scope.
 *
 * Host normalization:
 * - Port is stripped if present
 * - Host is lowercased for stable comparison
 *
 * Safety guarantees:
 * - Exact root domains are never treated as tenant hosts
 * - Prevents false positives across multi-domain deployments
 *
 * Examples:
 * - host="school.example.com", baseDomains=["example.com"]
 *     → { tenantId: "school", scope: "tenant" }
 *
 * - host="example.com", baseDomains=["example.com"]
 *     → undefined
 *
 * - host="school.example.org", baseDomains=["example.com"]
 *     → undefined
 *
 * - host="a.b.c" (no baseDomains)
 *     → { tenantId: "a", scope: "tenant" }
 *
 * @param host - Host header value (may include port).
 * @param baseDomains - Optional list of valid root domains (recommended).
 * @returns CiTenant resolution result or undefined if not resolvable.
 */
export function ciResolveTenantFromSubdomain(
  host: string,
  baseDomains?: readonly string[],
): { tenantId: string; scope: CiTenantScope } | undefined {
  const hostNoPort = host.split(":").at(0)?.toLowerCase();

  if (!hostNoPort || !hostNoPort.includes(".")) return undefined;

  // -------------------------------------------------------------------------
  // Root domain validated mode (preferred for production)
  // -------------------------------------------------------------------------
  if (baseDomains?.length) {
    for (const domain of baseDomains) {
      const bd = domain.toLowerCase();

      if (!hostNoPort.endsWith(`.${bd}`) && hostNoPort !== bd) {
        continue;
      }

      if (hostNoPort === bd) return undefined;

      const prefix = hostNoPort.slice(0, -(bd.length + 1));
      const parts = prefix.split(".").filter(Boolean);

      const tenantId = parts.at(0);

      if (!tenantId) return undefined;

      return { tenantId, scope: "tenant" };
    }

    return undefined;
  }

  const parts = hostNoPort.split(".").filter(Boolean);

  if (parts.length < 3) return undefined;

  const tenantId = parts.at(0);

  if (!tenantId) return undefined;

  return { tenantId, scope: "tenant" };
}
