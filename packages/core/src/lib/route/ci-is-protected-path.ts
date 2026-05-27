import type { CiRoutesMap } from "@ci-core/types";
import { ciMatchRoute } from "./ci-match-route";

/**
 * True if the matched route is protected.
 * If nothing matches, returns defaultWhenNoMatch (default false).
 */
export function ciIsProtectedPath(
  path: string | URL,
  routes: CiRoutesMap,
  defaultWhenNoMatch = false,
) {
  const match = ciMatchRoute(path, routes);
  return match ? !!match.route.protected : defaultWhenNoMatch;
}
