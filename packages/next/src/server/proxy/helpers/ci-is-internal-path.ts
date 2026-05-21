/**
 * Determines whether a pathname should be treated as an internal framework
 * or infrastructure route.
 *
 * Internal paths are excluded from:
 *
 * • CiTenant resolution logic
 * • Authentication / authorization guards
 * • Route rewriting
 * • Logging / tracing pipelines (in most cases)
 *
 * Why this matters:
 * Next.js, Vercel, and application backends expose system-level endpoints
 * that are not part of user navigation. Allowing proxy or tenant
 * logic to process these routes can cause:
 *
 * • Infinite rewrite / recursion loops
 * • Incorrect tenant detection
 * • Broken static asset delivery
 * • Performance regressions
 *
 * Special Case – `/ci-internal`:
 * This namespace is intentionally ignored to prevent proxy recursion.
 * CloudIgniter uses internal endpoints during tenant lookup and bootstrap
 * flows; processing them again through tenant resolution would produce
 * unstable behavior.
 *
 * Covered categories:
 *
 * Framework / platform internals:
 * - `/_next/*`     → Next.js runtime & assets
 * - `/_vercel/*`   → Vercel platform internals
 *
 * Backend endpoints:
 * - `/api/*`       → Next.js route handlers / API routes
 * - `/trpc/*`      → tRPC endpoints (if present)
 * - `/ci-internal/*` → CloudIgniter internal infrastructure routes
 *
 * Well-known static resources:
 * - `/favicon.ico`
 * - `/robots.txt`
 * - `/sitemap.xml`
 *
 * Design considerations:
 * - Matching is prefix-based for performance (no regex required).
 * - Function assumes pathname-only input (no query string).
 * - Keep this list minimal and deterministic — overmatching can bypass
 *   legitimate application routes.
 *
 * Examples:
 * - "/_next/static/chunk.js" → true
 * - "/api/users"             → true
 * - "/dashboard"             → false
 * - "/t/default/settings"    → false
 *
 * @param pathname - Normalized pathname (recommended: run through
 *                   normalizePathname() first).
 * @returns `true` if the route must bypass application logic.
 */
export function ciIsInternalPath(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_vercel") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/trpc") ||
    pathname.startsWith("/ci-internal") || // IMPORTANT: avoid recursion for internal tenant lookup
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}
