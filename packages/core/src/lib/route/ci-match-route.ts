import type { CiRouteMatch, CiRoutesMap } from "@ci-core/types";

import { ciNormalizePathname } from "@ci-core/lib";

import { ciGetRoutesMatcher } from "./ci-get-routes-matcher";

/**
 * Returns the best matching route definition and matching metadata.
 *
 * @param path - Runtime pathname or URL to match.
 * @param routes - Route pattern registry.
 * @returns The resolved route match, or null when no route matches.
 */
export function ciMatchRoute(path: string | URL, routes: CiRoutesMap): CiRouteMatch | null {
  const pathname = ciNormalizePathname(path);

  return ciGetRoutesMatcher(routes).resolve(pathname);
}
