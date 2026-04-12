import type {
  CiBuildSettingsKeysInput,
  CiSettingsKey,
} from "@cloudigniter/core/server";

/**
 * Build deterministic storage keys for settings records.
 *
 * Key format:
 *
 * - PK: `SETTING#{settingsId}`
 * - SK:
 *   - non-user: `SCOPE#{scope}#TENANT#{owner}`
 *   - user: `SCOPE#{scope}#TENANT#{owner}#USER#{userId}`
 *
 * Owner rules:
 * - `system` -> `system`
 * - `global` -> `global`
 * - `tenant` -> resolved tenant id or `default`
 *
 * @param input - Key generation input.
 * @returns Deterministic PK/SK pair.
 */
export function ciBuildSettingsKeys(
  input: CiBuildSettingsKeysInput,
): CiSettingsKey {
  const { settingsId, scope, targetTenantScope, tenantId, userId } = input;

  const owner =
    targetTenantScope === "tenant" ? tenantId ?? "default" : targetTenantScope;

  if (scope === "user" && !userId) {
    throw new Error("userId is required when building keys for user settings.");
  }

  return {
    PK: `SETTING#${settingsId}`,
    SK:
      scope === "user"
        ? `SCOPE#${scope}#TENANT#${owner}#USER#${userId}`
        : `SCOPE#${scope}#TENANT#${owner}`,
  };
}
