import type { CiRoutesMap } from "@ci-core/types";
import { ciResolveRouteDefinition } from "./ci-resolve-route";

/**
 * Get the namespace for a given path by resolving its route configuration.
 */
export function ciGetRouteNamespace(path: string | URL, routes: CiRoutesMap): string | undefined {
  return ciResolveRouteDefinition(path, routes)?.namespace;
}
