import { cache } from 'react';

import { ciNormalizeThrownError } from '@cloudigniter/next/utility';
import { ciUnwrapSettingsFromApiRespose } from '@cloudigniter/next/server';
import {
  CI_DEFAULT_PRIVATE_CORE_SETTINGS_ID,
  CI_DEFAULT_PUBLIC_CORE_SETTINGS_ID,
  CI_DEFAULT_USER_CORE_SETTINGS_ID,
} from '@cloudigniter/next/constants';
import type {
  CiGetSettingsApiInterface,
  CiGetSettingsHandlerInput,
  CiGraphQLResponse,
  CiRequest,
  CiServerErrorPayload,
  CiSettings,
  CiSettingsId,
  CiSettingsRegistry,
} from '@cloudigniter/next/types';

import { client } from '@/kernel/api/server';
import { ciBuildSettingsRegistry } from '@/custom/settings/ci-settings-registry';

type CiPersistedSettingsScope = 'public' | 'private' | 'user';

export const ciGetSettings = cache(
  async (params: CiGetSettingsApiInterface): Promise<CiSettings> => {
    try {
      const registry = ciBuildSettingsRegistry();

      const { publicSettingIds, privateSettingIds, userSettingIds } =
        ciResolveScopeIds(params, registry);

      const handlerInput: CiGetSettingsHandlerInput = {
        registry,
        tenantId: params.tenantId,
        userId: params.userId,
        publicSettingIds,
        privateSettingIds,
        userSettingIds,
        pathname: params.pathname,
        routeSettingIds: params.routeSettingIds,
      };

      const request: CiRequest<CiGetSettingsHandlerInput> = {
        input: handlerInput,
      };

      const apiResponse: CiGraphQLResponse = await client.queries.getSettings(
        { inputString: JSON.stringify(request) },
        { authMode: params.authMode }
      );

      return ciUnwrapSettingsFromApiRespose(apiResponse) as CiSettings;
    } catch (error: unknown) {
      const errorObj = ciNormalizeThrownError(error);

      throw new Error(
        JSON.stringify({
          title: '[Kernel:API:ciGetSettings()] Settings fetch failed',
          message: `Failed to get the settings! ${errorObj.message}`,
          severity: 'critical',
          showRetry: true,
        } satisfies CiServerErrorPayload)
      );
    }
  }
);

function ciResolveScopeIds(
  params: CiGetSettingsApiInterface,
  registry: CiSettingsRegistry
) {
  const requestedPublicIds = params.publicSettingIds ?? [];
  const requestedPrivateIds = params.privateSettingIds ?? [];
  const requestedUserIds = params.userSettingIds ?? [];

  const publicSettingIds =
    params.include?.includes('public') === false
      ? []
      : ciCollectScopeSettingIds({
          registry,
          scope: 'public',
          coreId: CI_DEFAULT_PUBLIC_CORE_SETTINGS_ID,
          requestedIds: requestedPublicIds,
        });

  if (params.authMode !== 'userPool') {
    return {
      publicSettingIds,
      privateSettingIds: [] as CiSettingsId[],
      userSettingIds: [] as CiSettingsId[],
    };
  }

  const privateSettingIds =
    params.include?.includes('private') === false
      ? []
      : ciCollectScopeSettingIds({
          registry,
          scope: 'private',
          coreId: CI_DEFAULT_PRIVATE_CORE_SETTINGS_ID,
          requestedIds: requestedPrivateIds,
        });

  const userSettingIds =
    params.include?.includes('user') === false
      ? []
      : ciCollectScopeSettingIds({
          registry,
          scope: 'user',
          coreId: CI_DEFAULT_USER_CORE_SETTINGS_ID,
          requestedIds: requestedUserIds,
        });

  return {
    publicSettingIds,
    privateSettingIds,
    userSettingIds,
  };
}

function ciCollectScopeSettingIds(input: {
  registry: CiSettingsRegistry;
  scope: CiPersistedSettingsScope;
  coreId: CiSettingsId;
  requestedIds?: CiSettingsId[];
}): CiSettingsId[] {
  const { registry, scope, coreId, requestedIds = [] } = input;

  const autoMergedIds: CiSettingsId[] = [];

  for (const [settingsId, entry] of registry.entries()) {
    if (settingsId === coreId) continue;
    if (entry.scope !== scope) continue;
    if (entry.mergeWithCore === false) continue;

    autoMergedIds.push(settingsId);
  }

  const safeRequestedIds = requestedIds.filter((settingsId) => {
    const entry = registry.get(settingsId);
    return !!entry && entry.scope === scope;
  });

  return ciUniqueIds([coreId, ...safeRequestedIds, ...autoMergedIds]).filter(
    (settingsId) => registry.has(settingsId)
  );
}

function ciUniqueIds(ids: CiSettingsId[]): CiSettingsId[] {
  return [...new Set(ids)];
}
