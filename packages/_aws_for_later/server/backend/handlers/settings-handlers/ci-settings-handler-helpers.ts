import { ciCreateDynamoSettingsStore, ciCreateSettingsService } from '@cloudigniter/services/settings/server';
import type { CiScopedSettingsScope, CiSettingsDefinition, CiSettingsRegistry } from '@cloudigniter/services/settings';

export function ciPickRegistryByScope(
  registry: CiSettingsRegistry,
  scope: CiSettingsDefinition['scope']
): CiSettingsRegistry {
  const ciOutput: CiSettingsRegistry = {};

  for (const [ciSettingsId, ciDefinition] of Object.entries(registry)) {
    if (ciDefinition.scope === scope) {
      ciOutput[ciSettingsId] = ciDefinition;
    }
  }

  return ciOutput;
}

export function ciResolvePersistedScope(definition: CiSettingsDefinition, settingsId: string): CiScopedSettingsScope {
  if (definition.scope === 'route') {
    throw new Error(`settingsId "${settingsId}" uses scope "route", which is not persisted by the Settings service.`);
  }

  return definition.scope;
}

export function ciResolveTableNameByScope(input: {
  scope: CiScopedSettingsScope;
  publicTableName: string;
  privateTableName: string;
  userTableName: string;
}): string {
  switch (input.scope) {
    case 'public':
      return input.publicTableName;

    case 'private':
      return input.privateTableName;

    case 'user':
      return input.userTableName;
  }
}

export function ciCreateScopedSettingsService(input: {
  registry: CiSettingsRegistry;
  scope: CiScopedSettingsScope;
  region: string;
  publicTableName: string;
  privateTableName: string;
  userTableName: string;
}) {
  const ciScopedRegistry = ciPickRegistryByScope(input.registry, input.scope);
  const ciTableName = ciResolveTableNameByScope({
    scope: input.scope,
    publicTableName: input.publicTableName,
    privateTableName: input.privateTableName,
    userTableName: input.userTableName,
  });

  return ciCreateSettingsService({
    registry: ciScopedRegistry,
    store: ciCreateDynamoSettingsStore({
      tableName: ciTableName,
      clientConfig: {
        region: input.region,
      },
    }),
  });
}
