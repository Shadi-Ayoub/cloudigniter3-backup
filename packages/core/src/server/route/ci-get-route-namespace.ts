import type { CiRoutesMap } from "@/types";
import { ciResolveRoute } from "./ci-resolve-route";

/**
 * Get the namespace for a given path by resolving its route configuration.
 */
export function ciGetRouteNamespace(
  path: string | URL,
  routes: CiRoutesMap,
): string | undefined {
  return ciResolveRoute(path, routes)?.namespace;
}
