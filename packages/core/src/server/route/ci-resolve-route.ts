import type { CiRoutesMap, CiRoute } from "@/types";
import { ciMatchRoute } from "./ci-match-route";

/**
 * Resolve a route by matching the current path.
 * Returns the Route object or null if none match.
 */
export function ciResolveRoute(
  path: string | URL,
  routes: CiRoutesMap,
): CiRoute | null {
  const m = ciMatchRoute(path, routes);
  return m ? m.route : null;
}
