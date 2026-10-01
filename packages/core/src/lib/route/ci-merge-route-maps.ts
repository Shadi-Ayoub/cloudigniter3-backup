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
      if (
        definition.settings !== undefined &&
        (!Array.isArray(definition.settings) ||
          definition.settings.some(
            (id) =>
              typeof id !== "string" ||
              !/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/.test(id),
          ))
      ) {
        throw new Error(`Invalid settings selection for route "${pattern}".`);
      }
      merged[pattern] = definition;
    }
  }

  return merged as CiRoutesMap;
}
