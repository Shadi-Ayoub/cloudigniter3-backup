import type { CiRoutesMap } from "@ci-core/types";
import { type CiCompiledRoutes } from "./ci-compile-routes";
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
export declare function ciGetRoutesMatcher(routes: CiRoutesMap): CiCompiledRoutes;
//# sourceMappingURL=ci-get-routes-matcher.d.ts.map