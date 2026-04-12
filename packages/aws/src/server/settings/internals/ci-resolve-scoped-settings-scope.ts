import type {
  CiSettingsScope,
  CiScopedSettingsScope,
} from "@cloudigniter/core";

/**
 * Resolve the persistence-supported scope for a requested domain scope.
 *
 * Route settings remain a domain-level concept. For persistence in v1,
 * route resolution falls back to public-scoped storage.
 *
 * @param scope - Requested domain scope.
 * @returns Persistence-supported scope.
 */
export function ciResolveScopedSettingsScope(
  scope: CiSettingsScope,
): CiScopedSettingsScope {
  if (scope === "route") {
    return "public";
  }

  return scope;
}
