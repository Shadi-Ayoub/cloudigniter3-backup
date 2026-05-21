import type { CiMatchedRoute, CiRoutesMap } from "@/types";
import { ciGetRoutesMatcher } from "./ci-get-routes-matcher";
/**
 * Returns the best matching route definition for a given path.
 *
 * This is a convenience wrapper around `ciGetRoutesMatcher(routes).match(path)`.
 * It reuses the cached compiled matcher, so callers do not need to manually
 * compile routes before matching.
 *
 * Typical usage:
 * - resolve whether a path is registered
 * - determine the most specific matching route
 * - support protected-route checks and route metadata lookup
 *
 * @param path - Runtime pathname or URL to match.
 * @param routes - Route pattern registry.
 * @returns The matched route result, or `null` when no route matches.
 */
export function ciMatchRoute(
  path: string | URL,
  routes: CiRoutesMap,
): CiMatchedRoute {
  return ciGetRoutesMatcher(routes).match(path);
}
