import type { CiRoutesMap } from "@ci-core/types";

import { ciMatchRoute } from "./ci-match-route";

/**
 * Returns true when the matched route is protected.
 * If no route matches, returns defaultWhenNoMatch.
 */
export function ciIsProtectedPath(path: string | URL, routes: CiRoutesMap, defaultWhenNoMatch = false): boolean {
  const match = ciMatchRoute(path, routes);

  return match ? Boolean(match.definition.protected) : defaultWhenNoMatch;
}
