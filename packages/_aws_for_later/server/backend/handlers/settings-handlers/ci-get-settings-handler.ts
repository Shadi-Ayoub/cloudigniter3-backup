import type { CiSettings, CiSettingsRegistry } from '@cloudigniter/services/settings';

import type { CiGetSettingsHandlerInput, CiGetSettingsHandlerOutput } from '@CI/types';
import { ciError500, ciOk200 } from '@CI/utility/server';

import { ciCreateLambdaHandler } from '../ci-create-lambda-handler';
import { ciInferHandlerName } from '../ci-infer-handler-name';
import { ciCreateScopedSettingsService, ciPickRegistryByScope } from './ci-settings-handler-helpers';

export const ciGetSettingsHandler = ciCreateLambdaHandler<
  CiGetSettingsHandlerInput,
  readonly [
    'CI_PUBLIC_SETTINGS_TABLE_NAME',
    'CI_PRIVATE_SETTINGS_TABLE_NAME',
    'CI_USER_SETTINGS_TABLE_NAME',
    'CI_REGION',
    'CI_ENV_MODE',
  ],
  CiGetSettingsHandlerInput
>({
  handlerName: ciInferHandlerName(import.meta.url),
  ciEnvVars: [
    'CI_PUBLIC_SETTINGS_TABLE_NAME',
    'CI_PRIVATE_SETTINGS_TABLE_NAME',
    'CI_USER_SETTINGS_TABLE_NAME',
    'CI_REGION',
    'CI_ENV_MODE',
  ] as const,

  validate: async ({ input, ciValidationError }) => {
    if (!input || typeof input !== 'object') {
      return ciValidationError('input is required.');
    }

    if (!input.registry) {
      return ciValidationError('registry is required.');
    }
  },

  run: async ({ input, env }) => {
    try {
      const ciRouteRegistry = ciPickRegistryByScope(input.registry, 'route');

      const ciPublicService = ciCreateScopedSettingsService({
        registry: input.registry,
        scope: 'public',
        region: env.CI_REGION,
        publicTableName: env.CI_PUBLIC_SETTINGS_TABLE_NAME,
        privateTableName: env.CI_PRIVATE_SETTINGS_TABLE_NAME,
        userTableName: env.CI_USER_SETTINGS_TABLE_NAME,
      });

      const ciPrivateService = ciCreateScopedSettingsService({
        registry: input.registry,
        scope: 'private',
        region: env.CI_REGION,
        publicTableName: env.CI_PUBLIC_SETTINGS_TABLE_NAME,
        privateTableName: env.CI_PRIVATE_SETTINGS_TABLE_NAME,
        userTableName: env.CI_USER_SETTINGS_TABLE_NAME,
      });

      const ciUserService = ciCreateScopedSettingsService({
        registry: input.registry,
        scope: 'user',
        region: env.CI_REGION,
        publicTableName: env.CI_PUBLIC_SETTINGS_TABLE_NAME,
        privateTableName: env.CI_PRIVATE_SETTINGS_TABLE_NAME,
        userTableName: env.CI_USER_SETTINGS_TABLE_NAME,
      });

      const ciPublicSettings = await ciResolveSettingsGroup({
        service: ciPublicService,
        settingsIds: input.publicSettingIds,
        tenantId: input.tenantId,
        userId: input.userId,
      });

      const ciPrivateSettings = await ciResolveSettingsGroup({
        service: ciPrivateService,
        settingsIds: input.privateSettingIds,
        tenantId: input.tenantId,
        userId: input.userId,
      });

      const ciUserSettings = await ciResolveSettingsGroup({
        service: ciUserService,
        settingsIds: input.userSettingIds,
        tenantId: input.tenantId,
        userId: input.userId,
      });

      const ciRouteSettings = ciResolveRouteSettingsGroup({
        registry: ciRouteRegistry,
        settingsIds: input.routeSettingIds,
      });

      const ciBody: CiGetSettingsHandlerOutput = {
        publicSettings: ciPublicSettings,
        privateSettings: ciPrivateSettings,
        userSettings: ciUserSettings,
        routeSettings: ciRouteSettings,
        pathname: input.pathname ?? null,
      };

      return ciOk200(ciBody);
    } catch (error) {
      const ciMessage = error instanceof Error ? error.message : 'Failed to resolve settings.';

      return ciError500(ciMessage, { error });
    }
  },
});

async function ciResolveSettingsGroup(input: {
  service: {
    get(args: { settingsId: string; tenantId?: string; userId?: string }): Promise<{ value: CiSettings }>;
  };
  settingsIds?: string[];
  tenantId?: string;
  userId?: string;
}): Promise<Record<string, CiSettings>> {
  const ciOutput: Record<string, CiSettings> = {};

  for (const ciSettingsId of input.settingsIds ?? []) {
    const ciResolved = await input.service.get({
      settingsId: ciSettingsId,
      tenantId: input.tenantId,
      userId: input.userId,
    });

    ciOutput[ciSettingsId] = ciResolved.value;
  }

  return ciOutput;
}

function ciResolveRouteSettingsGroup(input: {
  registry: CiSettingsRegistry;
  settingsIds?: string[];
}): Record<string, CiSettings> {
  const ciOutput: Record<string, CiSettings> = {};

  for (const ciSettingsId of input.settingsIds ?? []) {
    const ciDefinition = input.registry[ciSettingsId];

    if (!ciDefinition) {
      continue;
    }

    ciOutput[ciSettingsId] = ciCloneSettings(ciDefinition.defaults ?? {});
  }

  return ciOutput;
}

function ciCloneSettings(value: CiSettings): CiSettings {
  const ciOutput: CiSettings = {};

  for (const [ciKey, ciNestedValue] of Object.entries(value)) {
    ciOutput[ciKey] = ciCloneSettingsValue(ciNestedValue);
  }

  return ciOutput;
}

function ciCloneSettingsValue<T>(value: T): T {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((ciItem) => ciCloneSettingsValue(ciItem)) as T;
  }

  if (typeof value === 'object') {
    const ciOutput: Record<string, unknown> = {};

    for (const [ciKey, ciNestedValue] of Object.entries(value as Record<string, unknown>)) {
      ciOutput[ciKey] = ciCloneSettingsValue(ciNestedValue);
    }

    return ciOutput as T;
  }

  return value;
}
