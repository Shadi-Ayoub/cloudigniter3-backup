import type { CiRouteDefinition, CiRoutesMap } from "@ci-core/types";

/** Merges independently owned route registries and rejects ambiguous ownership. */
export function ciMergeRouteMaps(
  ...routeMaps: readonly CiRoutesMap[]
): CiRoutesMap {
  const merged: Record<string, CiRouteDefinition> = {};

  for (const routeMap of routeMaps) {
    for (const [pattern, definition] of Object.entries(routeMap)) {
      if (Object.hasOwn(merged, pattern)) {
        throw new Error(
          `CloudIgniter route collision: "${pattern}" is registered more than once. ` +
            "Choose a different custom management path instead of replacing a core route.",
        );
      }
      merged[pattern] = definition;
    }
  }

  return merged as CiRoutesMap;
}
