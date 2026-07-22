/**
 * Builds a tenant-scoped rewrite pathname based on the normalized request path.
 *
 * Purpose:
 * CloudIgniter supports tenant-aware routing where application pages are logically
 * namespaced under a tenant base path (for example `/t/{tenantId}`).
 * This helper constructs the correct rewrite target while preventing invalid
 * or recursive rewrites.
 *
 * Core behavior:
 *
 * 1) Root handling
 *    "/" → "{tenantBasePath}/{tenant}"
 *
 *    The root path is converted into the tenant landing namespace. This is
 *    critical for slug-based tenant routing where visiting the domain root
 *    should resolve into a tenant context.
 *
 * 2) Idempotent protection
 *    If the pathname already begins with the tenant base path, the value is
 *    returned unchanged.
 *
 *    This avoids double-prefixing and infinite proxy rewrite loops.
 *
 * 3) Standard tenant prefixing
 *    All other paths are rewritten into:
 *
 *      "{tenantBasePath}/{tenant}{pathname}"
 *
 * Why this matters:
 * Middleware may execute multiple times during navigation, redirects,
 * and asset fetching. Deterministic rewrite rules ensure:
 *
 * • Stable tenant resolution
 * • No duplicated path segments
 * • No recursive rewrites
 * • Correct link sharing / deep linking
 *
 * Design constraints:
 * - `pathnameNormalized` MUST already be normalized (no trailing slash,
 *   duplicate slashes collapsed).
 * - Function operates purely on pathnames (no query strings).
 * - `tenantBasePath` is assumed to be canonical (typically "/t").
 *
 * Examples (tenantBasePath = "/t", tenant = "default"):
 *
 * "/"                  → "/t/default"
 * "/dashboard"         → "/t/default/dashboard"
 * "/t/default/users"   → "/t/default/users" (unchanged)
 *
 * Edge-case protection:
 * The base path check intentionally precedes concatenation to prevent
 * accidental rewrites like:
 *
 *   "/t/default/dashboard" → "/t/default/t/default/dashboard"
 *
 * @param pathnameNormalized - Canonical pathname (output of normalizePathname()).
 * @param tenant             - Resolved tenant identifier / slug.
 * @param opts               - CiTenant routing configuration.
 * @returns CiTenant-scoped rewrite pathname.
 */
export function ciBuildTenantRewritePath(
  pathnameNormalized: string,
  tenant: string,
  tenantBasePath: string,
) {
  if (pathnameNormalized === "/") return `${tenantBasePath}/${tenant}`;
  if (pathnameNormalized.startsWith(tenantBasePath + "/"))
    return pathnameNormalized;

  return `${tenantBasePath}/${tenant}${pathnameNormalized}`;
}
