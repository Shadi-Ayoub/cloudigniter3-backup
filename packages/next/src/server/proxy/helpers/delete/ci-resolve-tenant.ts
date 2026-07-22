// import type {
//   CiTenantResolutionOptions,
//   CiTenantResolutionResult,
//   CiTenantMode,
// } from "@cloudigniter/core/types";
// import { ciBuildTenantRewritePath } from "./ci-build-tenant-rewrite-path";
// import { ciResolveTenantFromSlugPath } from "./ci-resolve-tenant-from-slug-path";
// import { ciResolveTenantFromSubdomain } from "./ci-resolve-tenant-from-subdomain";

// /**
//  * Resolves the effective tenant context for the current request and optionally
//  * produces a rewrite decision.
//  *
//  * Architectural role:
//  * --------------------
//  * `resolveTenant()` is the single authoritative decision point for tenant
//  * detection inside CloudIgniter middleware. It encapsulates:
//  *
//  * • CiTenant resolution precedence
//  * • Routing-mode semantics (slug vs subdomain)
//  * • Rewrite eligibility rules
//  * • Fail-safe behavior for non-tenant requests
//  *
//  * This function MUST remain pure and side-effect free:
//  *
//  * ✔ No Next.js imports
//  * ✔ No NextResponse construction
//  * ✔ No cookie mutations
//  *
//  * Middleware is responsible for applying the returned decision.
//  *
//  * ---------------------------------------------------------------------------
//  * CiTenant Resolution Precedence
//  * ---------------------------------------------------------------------------
//  *
//  * Resolution follows a strict deterministic order:
//  *
//  * 1) Bypass (highest priority)
//  *    If routing is disabled or request is flagged as bypassed
//  *    (internal/static/framework routes), tenant resolution is skipped.
//  *
//  * 2) Header-injected tenant
//  *    Trusted internal propagation mechanism used to prevent re-resolution
//  *    and middleware recursion.
//  *
//  *    Typical header:
//  *      x-ci-tenant: <tenantId>
//  *
//  * 3) Slug routing (mode = "slug")
//  *    Extract tenant from pathname namespace:
//  *
//  *      /t/{tenantId}/...
//  *
//  * 4) Subdomain routing (mode = "subdomain")
//  *    Extract tenant from host:
//  *
//  *      {tenantId}.domain.tld
//  *
//  * 5) Fallback tenant (optional)
//  *    Applied only when explicitly configured.
//  *
//  * 6) None
//  *    No tenant could be determined.
//  *
//  * ---------------------------------------------------------------------------
//  * Rewrite Semantics
//  * ---------------------------------------------------------------------------
//  *
//  * Rewrites are NEVER applied automatically. Instead, the function MAY return
//  * a `rewritePathname` when ALL conditions are satisfied:
//  *
//  * ✔ Routing mode = subdomain
//  * ✔ CiTenant resolved from subdomain
//  * ✔ rewriteSubdomainToTenantPath enabled
//  * ✔ CiRequest is not bypassed
//  *
//  * This supports canonicalization:
//  *
//  *   schoolA.example.com/dashboard → /t/schoolA/dashboard
//  *
//  * Without coupling resolution logic to Next.js runtime behavior.
//  *
//  * ---------------------------------------------------------------------------
//  * Determinism & Idempotency
//  * ---------------------------------------------------------------------------
//  *
//  * The resolver intentionally avoids:
//  *
//  * ✘ Double-prefixing paths
//  * ✘ Recursive rewrites
//  * ✘ Mixed tenant sources
//  *
//  * Idempotency is guaranteed by:
//  *
//  * • Header precedence
//  * • Path base checks
//  * • Canonical pathname input
//  *
//  * ---------------------------------------------------------------------------
//  * Security Posture
//  * ---------------------------------------------------------------------------
//  *
//  * IMPORTANT:
//  *
//  * - Header-based tenants MUST only be trusted if injected by your own
//  *   middleware / gateway layer.
//  *
//  * - Absence of tenant does NOT imply fallback safety.
//  *   Protected routes should typically fail closed.
//  *
//  * ---------------------------------------------------------------------------
//  * Expected Inputs
//  * ---------------------------------------------------------------------------
//  *
//  * pathnameNormalized:
//  *   Canonical pathname (already normalized).
//  *
//  * headers:
//  *   Minimal header set required for precedence checks.
//  *
//  * host:
//  *   Required only for subdomain routing.
//  *
//  * bypass:
//  *   Precomputed bypass signal from middleware.
//  *
//  * ---------------------------------------------------------------------------
//  * Return Contract
//  * ---------------------------------------------------------------------------
//  *
//  * tenantId:
//  *   Resolved tenant identifier (if any).
//  *
//  * scope:
//  *   "tenant" when tenant resolved, otherwise "global".
//  *
//  * source:
//  *   Resolution origin (header, slug, subdomain, fallback, bypass).
//  *
//  * rewritePathname:
//  *   Optional canonical rewrite target (middleware decides whether to apply).
//  *
//  * featurePathname:
//  *   Logical application pathname (used in slug mode).
//  *
//  * ---------------------------------------------------------------------------
//  * Why centralize this logic?
//  * ---------------------------------------------------------------------------
//  *
//  * CiTenant resolution bugs are among the most destructive classes of middleware
//  * failures (infinite loops, wrong tenant data exposure, broken navigation).
//  *
//  * Centralizing precedence + rewrite rules ensures:
//  *
//  * ✔ Predictable behavior
//  * ✔ Easier debugging
//  * ✔ Safer refactoring
//  * ✔ Testability outside Next.js
//  *
//  * @param input.pathnameNormalized - Canonical pathname (normalizePathname()).
//  * @param input.headers - CiRequest headers (or a subset).
//  * @param input.host - Host header value (if available).
//  * @param opts - CiTenant resolution configuration.
//  * @param isBypassed - Precomputed bypass signal (internal/api path).
//  * @returns CiTenantResolutionResult with `{ tenantId, source }`.
//  */
// export function ciResolveTenant(
//   input: {
//     pathnameNormalized: string;
//     // headers: Record<string, string | undefined>;
//     host?: string;
//     mode: CiTenantMode;
//   },
//   opts: CiTenantResolutionOptions,
//   //   isBypassed: boolean
// ): CiTenantResolutionResult {
//   if (!opts.enabled) {
//     return { id: undefined, scope: "system", source: "bypass" };
//   }

//   // Getting tenant from header should be in the application and not the middleware!
//   // 1) Header-based (trusted internal hop)
//   // const headerTenant = input.headers[opts.tenantHeaderKey];
//   // if (headerTenant) {
//   //   const scope: CiTenantScope = (input.headers[opts.scopeHeaderName] as CiTenantScope) ?? 'system';
//   //   return { tenantId: headerTenant, scope, source: 'header' };
//   // }

//   // 2) Slug routing (resolve from pathname)
//   if (opts.tenantRoutingMode === "slug") {
//     const slug = ciResolveTenantFromSlugPath(
//       input.pathnameNormalized,
//       opts.tenantBasePath,
//     );

//     if (slug) {
//       // slug matched the namespace, so scope is either tenant or global
//       return slug.scope === "tenant"
//         ? {
//             id: slug.tenantId,
//             scope: "tenant",
//             source: "slug",
//             featurePathname: slug.featurePathname,
//           }
//         : {
//             scope: "global",
//             source: "slug",
//             // featurePathname: slug.featurePathname,
//           };
//     }

//     // Not under /t → this is a SYSTEM route (as per CI semantics)
//     return { id: undefined, scope: "system", source: "none" };
//   }

//   // 3) Subdomain routing
//   if (opts.tenantRoutingMode === "subdomain" && input.host) {
//     const subTenant = ciResolveTenantFromSubdomain(input.host, opts.baseDomain);
//     if (subTenant) {
//       const result: CiTenantResolutionResult = {
//         id: subTenant.tenantId,
//         scope: subTenant.scope,
//         source: "subdomain",
//       };

//       // Optional rewrite decision (subdomain → tenant path)
//       if (opts.rewriteSubdomainToTenantPath) {
//         result.rewritePathname = ciBuildTenantRewritePath(
//           input.pathnameNormalized,
//           subTenant.tenantId,
//           opts.tenantBasePath,
//         );
//       }

//       return result;
//     }

//     // No tenant subdomain → SYSTEM
//     return { id: undefined, scope: "system", source: "none" };
//   }

//   // 4) fallback
//   if (opts.fallbackTenantId) {
//     return {
//       id: opts.fallbackTenantId,
//       scope: "tenant",
//       source: "fallback",
//     };
//   }

//   return { id: undefined, scope: "system", source: "none" };
// }
