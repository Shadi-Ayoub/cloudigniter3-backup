import type { CiRouteDefinition, CiRoutesMap } from "@ci-core/types";

import { ciMatchRoute } from "./ci-match-route";

/**
 * Resolves the registered route definition matching the current path.
 * Returns null when no route matches.
 */
export function ciResolveRouteDefinition(path: string | URL, routes: CiRoutesMap): CiRouteDefinition | null {
  const match = ciMatchRoute(path, routes);

  return match?.definition ?? null;
}
