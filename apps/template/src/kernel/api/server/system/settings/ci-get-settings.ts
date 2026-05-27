import { cache } from "react";

import {
  CI_DEFAULT_PRIVATE_CORE_SETTINGS_ID,
  CI_DEFAULT_PUBLIC_CORE_SETTINGS_ID,
  CI_DEFAULT_USER_CORE_SETTINGS_ID,
  ciMergeSettings,
  ciNormalizeThrownError,
} from "@cloudigniter/core/lib";
import type { CiSettings, CiSettingsRegistry } from "@cloudigniter/core/types";

import type {
  CiGetSettingsApiInterface,
  CiGetSettingsHandlerInput,
  CiGetSettingsHandlerOutput,
  CiGraphQLResponse,
  CiRequest,
  CiServerErrorPayload,
} from "@cloudigniter/core/types";

import { client } from "@/kernel/api/server";
import { ciBuildSettingsRegistry } from "@/custom/settings/ci-settings-registry";

type CiPersistedSettingsScope = "public" | "private" | "user";

export type CiSettingsId = string;

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
        { authMode: params.authMode },
      );

      const handlerOutput = ciUnwrapGetSettingsHandlerResponse(apiResponse);

      return ciBuildMergedSettingsFromHandlerOutput(handlerOutput);
    } catch (error: unknown) {
      const errorObj = ciNormalizeThrownError(error);

      throw new Error(
        JSON.stringify({
          title: "[Kernel:API:ciGetSettings()] Settings fetch failed",
          message: `Failed to get the settings! ${errorObj.message}`,
          severity: "critical",
          showRetry: true,
        } satisfies CiServerErrorPayload),
      );
    }
  },
);

function ciResolveScopeIds(
  params: CiGetSettingsApiInterface,
  registry: CiSettingsRegistry,
) {
  const requestedPublicIds = params.publicSettingIds ?? [];
  const requestedPrivateIds = params.privateSettingIds ?? [];
  const requestedUserIds = params.userSettingIds ?? [];

  const publicSettingIds =
    params.include?.includes("public") === false
      ? []
      : ciCollectScopeSettingIds({
          registry,
          scope: "public",
          coreId: CI_DEFAULT_PUBLIC_CORE_SETTINGS_ID,
          requestedIds: requestedPublicIds,
        });

  if (params.authMode !== "userPool") {
    return {
      publicSettingIds,
      privateSettingIds: [] as CiSettingsId[],
      userSettingIds: [] as CiSettingsId[],
    };
  }

  const privateSettingIds =
    params.include?.includes("private") === false
      ? []
      : ciCollectScopeSettingIds({
          registry,
          scope: "private",
          coreId: CI_DEFAULT_PRIVATE_CORE_SETTINGS_ID,
          requestedIds: requestedPrivateIds,
        });

  const userSettingIds =
    params.include?.includes("user") === false
      ? []
      : ciCollectScopeSettingIds({
          registry,
          scope: "user",
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

  for (const [settingsId, entry] of Object.entries(registry)) {
    if (settingsId === coreId) continue;
    if (entry.scope !== scope) continue;
    if ("mergeWithCore" in entry && entry.mergeWithCore === false) continue;

    autoMergedIds.push(settingsId as CiSettingsId);
  }

  const safeRequestedIds = requestedIds.filter((settingsId) => {
    const entry = registry[settingsId];
    return !!entry && entry.scope === scope;
  });

  return ciUniqueIds([coreId, ...safeRequestedIds, ...autoMergedIds]).filter(
    (settingsId) => !!registry[settingsId],
  );
}

function ciUniqueIds(ids: CiSettingsId[]): CiSettingsId[] {
  return [...new Set(ids)];
}

function ciUnwrapGetSettingsHandlerResponse(
  apiResponse: CiGraphQLResponse,
): CiGetSettingsHandlerOutput {
  const rawBody =
    (apiResponse as { data?: { getSettings?: { body?: unknown } } }).data
      ?.getSettings?.body ?? (apiResponse as { body?: unknown }).body;

  if (!rawBody) {
    throw new Error("Settings response body is missing.");
  }

  const parsedBody =
    typeof rawBody === "string"
      ? (JSON.parse(rawBody) as CiGetSettingsHandlerOutput)
      : (rawBody as CiGetSettingsHandlerOutput);

  return parsedBody;
}

function ciBuildMergedSettingsFromHandlerOutput(
  input: CiGetSettingsHandlerOutput,
): CiSettings {
  let output: CiSettings = {};

  output = ciMergeSettings(output, ciMergeSettingsGroup(input.publicSettings));
  output = ciMergeSettings(output, ciMergeSettingsGroup(input.privateSettings));
  output = ciMergeSettings(output, ciMergeSettingsGroup(input.userSettings));
  output = ciMergeSettings(output, ciMergeSettingsGroup(input.routeSettings));

  return output;
}

function ciMergeSettingsGroup(group: Record<string, CiSettings>): CiSettings {
  let output: CiSettings = {};

  for (const settings of Object.values(group)) {
    output = ciMergeSettings(output, settings);
  }

  return output;
}
