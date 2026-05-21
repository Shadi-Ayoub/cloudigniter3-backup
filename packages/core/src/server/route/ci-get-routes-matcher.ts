import type { CiRoutesMap } from "@/types";
import { ciCompileRoutes, type CiCompiledRoutes } from "./ci-compile-routes";

/**
 * WeakMap cache of compiled route matchers keyed by the original routes object.
 *
 * Why WeakMap:
 * - avoids recompiling the same route map repeatedly
 * - keeps lookups fast for module-level route constants
 * - allows garbage collection when a routes object is no longer referenced
 *
 * This is especially useful in middleware, guards, and route utilities
 * that may perform repeated matching against the same route registry.
 */
const ciRoutesMatcherCache = new WeakMap<CiRoutesMap, CiCompiledRoutes>();

/**
 * Returns a compiled route matcher for the provided routes map.
 *
 * The compiled matcher is cached per `routes` object reference, so repeated calls
 * with the same routes object reuse the same compiled matcher instance.
 *
 * Typical usage:
 * - middleware route checks
 * - authorization / RBAC guards
 * - navigation and path resolution utilities
 *
 * Notes:
 * - Caching is reference-based, not deep-value-based.
 * - Best results are achieved when `routes` is defined once as a stable module-level constant.
 *
 * @param routes - Route pattern registry to compile and cache.
 * @returns Compiled routes helper with matching utilities.
 */
export function ciGetRoutesMatcher(routes: CiRoutesMap): CiCompiledRoutes {
  const cached = ciRoutesMatcherCache.get(routes);

  if (cached) {
    return cached;
  }

  const compiled = ciCompileRoutes(routes);
  ciRoutesMatcherCache.set(routes, compiled);

  return compiled;
}
