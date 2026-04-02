import type {
  CiLoadedSettingsLayers,
  CiResolvedSettingsResult,
  CiSettings,
} from '../common/types';
import {
  ciMergeSettings,
} from '../common/ci-merge-settings';
import {
  ciCloneSettingsValue,
  ciGetRequiredSettingsDefinition,
  ciMergeSettingsWithControl,
  ciResolveScopedSettingsScope,
  ciValidateResolvedSettings,
} from '../internal';
import type {
  CiGetResolvedSettingsInput,
  CiGetSettingsRecordInput,
  CiSettingsService,
  CiSettingsStore,
} from './types';

/**
 * Create a settings service over a store implementation.
 *
 * @param store - Backing settings store.
 * @returns Settings service.
 */
export function ciCreateSettingsService(store: CiSettingsStore): CiSettingsService {
  const loadLayers = async <TSettings extends CiSettings = CiSettings>(
    input: CiGetResolvedSettingsInput,
  ): Promise<CiLoadedSettingsLayers<TSettings>> => {
    const { registry, settingsId, scope, context } = input;
    const definition = ciGetRequiredSettingsDefinition(registry, settingsId);
    const scopedScope = ciResolveScopedSettingsScope(scope);

    const defaults = ciCloneSettingsValue((definition.defaults ?? {}) as TSettings);

    const baseInput = {
      settingsId,
      scope: scopedScope,
      tenantId: context?.tenantId,
      userId: context?.userId,
    };

    const system = await store.getRecord<TSettings>({
      ...baseInput,
      targetTenantScope: 'system',
    });

    const globalLayer = await store.getRecord<TSettings>({
      ...baseInput,
      targetTenantScope: 'global',
    });

    const tenant = context?.tenantId
      ? await store.getRecord<TSettings>({
          ...baseInput,
          targetTenantScope: 'tenant',
        })
      : null;

    const user =
      scopedScope === 'user' && context?.userId
        ? await store.getRecord<TSettings>({
            ...baseInput,
            targetTenantScope: 'tenant',
          })
        : null;

    return {
      defaults,
      system: system?.value,
      global: globalLayer?.value,
      tenant: tenant?.value,
      user: user?.value,
    };
  };

  return {
    async getResolved<TSettings extends CiSettings = CiSettings>(
      input: CiGetResolvedSettingsInput,
    ): Promise<CiResolvedSettingsResult<TSettings>> {
      const { registry, settingsId, scope, context, canOverride } = input;
      const definition = ciGetRequiredSettingsDefinition(registry, settingsId);
      const scopedScope = ciResolveScopedSettingsScope(scope);
      const layers = await loadLayers<TSettings>(input);

      let resolved = ciCloneSettingsValue(layers.defaults);

      resolved = ciMergeSettings(resolved, (layers.system ?? {}) as Partial<TSettings>);
      resolved = await ciMergeSettingsWithControl({
        settingsId,
        baseValue: resolved,
        incomingValue: layers.global,
        fromLayer: 'system',
        toLayer: 'global',
        tenantId: context?.tenantId,
        userId: context?.userId,
        canOverride,
      });
      resolved = await ciMergeSettingsWithControl({
        settingsId,
        baseValue: resolved,
        incomingValue: layers.tenant,
        fromLayer: 'global',
        toLayer: 'tenant',
        tenantId: context?.tenantId,
        userId: context?.userId,
        canOverride,
      });
      resolved = await ciMergeSettingsWithControl({
        settingsId,
        baseValue: resolved,
        incomingValue: layers.user,
        fromLayer: 'tenant',
        toLayer: 'user',
        tenantId: context?.tenantId,
        userId: context?.userId,
        canOverride,
      });

      resolved = ciValidateResolvedSettings(
        definition as typeof definition & { defaults?: TSettings },
        resolved,
      );

      return {
        settingsId,
        scope,
        scopedScope,
        defaults: ciCloneSettingsValue(layers.defaults),
        value: resolved,
        layers,
      };
    },

    async getRecord<TSettings extends CiSettings = CiSettings>(
      input: CiGetSettingsRecordInput,
    ) {
      return store.getRecord<TSettings>(input);
    },

    async setRecord<TSettings extends CiSettings = CiSettings>(input) {
      return store.setRecord<TSettings>(input);
    },

    async deleteRecord(input) {
      return store.deleteRecord(input);
    },
  };
}
