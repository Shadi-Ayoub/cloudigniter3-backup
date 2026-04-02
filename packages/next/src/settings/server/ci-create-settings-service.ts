import { ciMergeSettings } from "../common/ci-merge-settings";
import type { CiLoadedSettingsLayers } from "../common/types/CiLoadedSettingsLayers";
import type { CiResolvedSettingsResult } from "../common/types/CiResolvedSettingsResult";
import type { CiSettings } from "../common/types/CiSettings";
import type { CiSettingsDefinition } from "../common/types/CiSettingsDefinition";
import { ciCloneSettingsValue } from "../internal/ci-clone-settings-value";
import { ciGetRequiredSettingsDefinition } from "../internal/ci-get-required-settings-definition";
import { ciMergeSettingsWithControl } from "../internal/ci-merge-settings-with-control";
import { ciResolveScopedSettingsScope } from "../internal/ci-resolve-scoped-settings-scope";
import { ciValidateResolvedSettings } from "../internal/ci-validate-resolved-settings";
import type { CiDeleteSettingsInput } from "./types/CiDeleteSettingsInput";
import type { CiGetResolvedSettingsInput } from "./types/CiGetResolvedSettingsInput";
import type { CiGetSettingsRecordInput } from "./types/CiGetSettingsRecordInput";
import type { CiSettingsService } from "./types/CiSettingsService";
import type { CiSettingsStore } from "./types/CiSettingsStore";
import type { CiSetSettingsInput } from "./types/CiSetSettingsInput";

/**
 * Create a settings service over a store implementation.
 *
 * This service is responsible for:
 * - loading persisted layers
 * - merging them with defaults
 * - applying override control
 * - validating the final resolved result
 *
 * @param store - Backing settings store.
 * @returns Settings service.
 */
export function ciCreateSettingsService(
  store: CiSettingsStore,
): CiSettingsService {
  const ciLoadLayers = async <TSettings extends CiSettings = CiSettings>(
    input: CiGetResolvedSettingsInput,
  ): Promise<CiLoadedSettingsLayers<TSettings>> => {
    const { registry, settingsId, scope, context } = input;
    const ciDefinition = ciGetRequiredSettingsDefinition(registry, settingsId);
    const ciScopedScope = ciResolveScopedSettingsScope(scope);

    const ciDefaults = ciCloneSettingsValue(
      (ciDefinition.defaults ?? {}) as TSettings,
    );

    const ciBaseInput = {
      settingsId,
      scope: ciScopedScope,
      tenantId: context?.tenantId,
      userId: context?.userId,
    };

    const ciSystemRecord = await store.getRecord<TSettings>({
      ...ciBaseInput,
      targetTenantScope: "system",
    });

    const ciGlobalRecord = await store.getRecord<TSettings>({
      ...ciBaseInput,
      targetTenantScope: "global",
    });

    const ciTenantRecord = context?.tenantId
      ? await store.getRecord<TSettings>({
          ...ciBaseInput,
          targetTenantScope: "tenant",
        })
      : null;

    const ciUserRecord =
      ciScopedScope === "user" && context?.userId
        ? await store.getRecord<TSettings>({
            ...ciBaseInput,
            scope: "user",
            targetTenantScope: "tenant",
            userId: context.userId,
          })
        : null;

    return {
      defaults: ciDefaults,
      system: ciSystemRecord?.value,
      global: ciGlobalRecord?.value,
      tenant: ciTenantRecord?.value,
      user: ciUserRecord?.value,
    };
  };

  return {
    async getResolved<TSettings extends CiSettings = CiSettings>(
      input: CiGetResolvedSettingsInput,
    ): Promise<CiResolvedSettingsResult<TSettings>> {
      const { registry, settingsId, scope, context, canOverride } = input;

      const ciDefinition = ciGetRequiredSettingsDefinition(
        registry,
        settingsId,
      );
      const ciTypedDefinition = ciDefinition as CiSettingsDefinition<TSettings>;
      const ciScopedScope = ciResolveScopedSettingsScope(scope);
      const ciLayers = await ciLoadLayers<TSettings>(input);

      let ciResolved = ciCloneSettingsValue(ciLayers.defaults);

      ciResolved = ciMergeSettings(
        ciResolved,
        (ciLayers.system ?? {}) as Partial<TSettings>,
      );

      ciResolved = await ciMergeSettingsWithControl({
        settingsId,
        baseValue: ciResolved,
        incomingValue: ciLayers.global,
        fromLayer: "system",
        toLayer: "global",
        tenantId: context?.tenantId,
        userId: context?.userId,
        canOverride,
      });

      ciResolved = await ciMergeSettingsWithControl({
        settingsId,
        baseValue: ciResolved,
        incomingValue: ciLayers.tenant,
        fromLayer: "global",
        toLayer: "tenant",
        tenantId: context?.tenantId,
        userId: context?.userId,
        canOverride,
      });

      ciResolved = await ciMergeSettingsWithControl({
        settingsId,
        baseValue: ciResolved,
        incomingValue: ciLayers.user,
        fromLayer: "tenant",
        toLayer: "user",
        tenantId: context?.tenantId,
        userId: context?.userId,
        canOverride,
      });

      ciResolved = ciValidateResolvedSettings(ciTypedDefinition, ciResolved);

      return {
        settingsId,
        scope,
        scopedScope: ciScopedScope,
        defaults: ciCloneSettingsValue(ciLayers.defaults),
        value: ciResolved,
        layers: ciLayers,
      };
    },

    async getRecord<TSettings extends CiSettings = CiSettings>(
      input: CiGetSettingsRecordInput,
    ) {
      return store.getRecord<TSettings>(input);
    },

    async setRecord<TSettings extends CiSettings = CiSettings>(
      input: CiSetSettingsInput<TSettings>,
    ) {
      return store.setRecord<TSettings>(input);
    },

    async deleteRecord(input: CiDeleteSettingsInput) {
      return store.deleteRecord(input);
    },
  };
}
