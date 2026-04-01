import type { CiBuildSettingsKeysInput, CiSettingsKeys } from './types';

/**
 * Build deterministic settings keys for the persistence layer.
 *
 * @param input - Key generation input.
 * @returns Partition and sort key pair.
 */
export function ciBuildSettingsKeys(input: CiBuildSettingsKeysInput): CiSettingsKeys {
  const { settingsId, scope, targetTenantScope, tenantId, userId } = input;

  const owner =
    targetTenantScope === 'tenant'
      ? tenantId ?? 'default'
      : targetTenantScope;

  if (scope === 'user' && !userId) {
    throw new Error('userId is required when building keys for user settings.');
  }

  return {
    PK: `SETTING#${settingsId}`,
    SK:
      scope === 'user'
        ? `SCOPE#${scope}#TENANT#${owner}#USER#${userId}`
        : `SCOPE#${scope}#TENANT#${owner}`,
  };
}
