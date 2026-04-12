import type { CiScopedSettingsScope } from '@cloudigniter/services/settings';

import type { CiSetSettingsHandlerInput, CiSetSettingsHandlerOutput } from '@CI/types';
import { ciError500, ciOk200 } from '@CI/utility/server';

import { ciCreateLambdaHandler } from '../ci-create-lambda-handler';
import { ciInferHandlerName } from '../ci-infer-handler-name';
import { ciCreateScopedSettingsService, ciResolvePersistedScope } from './ci-settings-handler-helpers';

export const ciSetSettingsHandler = ciCreateLambdaHandler<
  CiSetSettingsHandlerInput,
  readonly [
    'CI_PUBLIC_SETTINGS_TABLE_NAME',
    'CI_PRIVATE_SETTINGS_TABLE_NAME',
    'CI_USER_SETTINGS_TABLE_NAME',
    'CI_REGION',
    'CI_ENV_MODE',
  ],
  CiSetSettingsHandlerInput
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

    if (!input.settingsId) {
      return ciValidationError('settingsId is required.');
    }

    if (!input.value || typeof input.value !== 'object') {
      return ciValidationError('value is required.');
    }

    const ciDefinition = input.registry[input.settingsId];

    if (!ciDefinition) {
      return ciValidationError(`settingsId "${input.settingsId}" is not registered.`);
    }

    const ciResolvedScope = input.scope ?? ciResolvePersistedScope(ciDefinition, input.settingsId);

    if (ciResolvedScope === 'user' && !input.userId) {
      return ciValidationError(
        `userId is required when writing user-scoped settings for settingsId "${input.settingsId}".`
      );
    }

    if (input.targetTenantScope === 'tenant' && !input.tenantId) {
      return ciValidationError(
        `tenantId is required when targetTenantScope is "tenant" for settingsId "${input.settingsId}".`
      );
    }
  },

  run: async ({ input, env }) => {
    try {
      const ciDefinition = input.registry[input.settingsId];

      if (!ciDefinition) {
        return ciError500(`settingsId "${input.settingsId}" is not registered.`);
      }

      const ciResolvedScope: CiScopedSettingsScope =
        input.scope ?? ciResolvePersistedScope(ciDefinition, input.settingsId);

      const ciService = ciCreateScopedSettingsService({
        registry: input.registry,
        scope: ciResolvedScope,
        region: env.CI_REGION,
        publicTableName: env.CI_PUBLIC_SETTINGS_TABLE_NAME,
        privateTableName: env.CI_PRIVATE_SETTINGS_TABLE_NAME,
        userTableName: env.CI_USER_SETTINGS_TABLE_NAME,
      });

      const ciResult = await ciService.set({
        settingsId: input.settingsId,
        scope: ciResolvedScope,
        tenantId: input.tenantId,
        userId: input.userId,
        targetTenantScope: input.targetTenantScope,
        value: input.value,
      });

      const ciBody: CiSetSettingsHandlerOutput = ciResult;

      return ciOk200(ciBody);
    } catch (error) {
      const ciMessage = error instanceof Error ? error.message : 'Failed to persist settings.';

      return ciError500(ciMessage, { error });
    }
  },
});
