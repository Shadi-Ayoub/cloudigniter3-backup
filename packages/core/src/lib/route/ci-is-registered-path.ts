import type { CiRoutesMap, CiRoute } from "@ci-core/types";
import { ciNormalizePath } from "@ci-core/lib";
import { ciMatchRoute } from "./ci-match-route";

/**
 * Returns true if the given path matches any registered route pattern.
 * - Handles exact paths, `/*` wildcards, and `:param` segments.
 * - Ignores query strings and hash fragments.
 */
export function ciIsRegisteredPath(
  path: string | URL,
  registeredRoutes: CiRoutesMap | Record<string, CiRoute>,
): boolean {
  const pathOnly =
    path instanceof URL ? path.pathname : String(path).split(/[?#]/)[0];

  const normalized = ciNormalizePath(pathOnly);
  return ciMatchRoute(normalized, registeredRoutes as CiRoutesMap) !== null;
}
