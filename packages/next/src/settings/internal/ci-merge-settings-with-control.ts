import type {
  CiCanOverrideSettingsValue,
  CiSettings,
  CiSettingsLayerName,
  CiSettingsValue,
} from '../common/types';
import { ciCloneSettingsValue } from './ci-clone-settings-value';

/**
 * Merge settings with an optional override control policy.
 *
 * The incoming layer is traversed recursively. When a path already has a value,
 * the policy callback can veto the overwrite.
 *
 * @param input - Merge input.
 * @returns Updated merged settings object.
 */
export async function ciMergeSettingsWithControl<TSettings extends CiSettings>(input: {
  settingsId: string;
  baseValue: TSettings;
  incomingValue?: Partial<TSettings>;
  fromLayer: CiSettingsLayerName;
  toLayer: CiSettingsLayerName;
  tenantId?: string;
  userId?: string;
  canOverride?: CiCanOverrideSettingsValue;
}): Promise<TSettings> {
  const {
    settingsId,
    baseValue,
    incomingValue,
    fromLayer,
    toLayer,
    tenantId,
    userId,
    canOverride,
  } = input;

  if (!incomingValue) {
    return baseValue;
  }

  const mergeObject = async (
    current: Record<string, CiSettingsValue>,
    incoming: Record<string, CiSettingsValue>,
    parentPath = '',
  ): Promise<Record<string, CiSettingsValue>> => {
    const output: Record<string, CiSettingsValue> = { ...current };

    for (const [key, nextValue] of Object.entries(incoming)) {
      const path = parentPath ? `${parentPath}.${key}` : key;
      const currentValue = output[key];

      if (
        currentValue &&
        nextValue &&
        typeof currentValue === 'object' &&
        typeof nextValue === 'object' &&
        !Array.isArray(currentValue) &&
        !Array.isArray(nextValue)
      ) {
        output[key] = await mergeObject(
          currentValue as Record<string, CiSettingsValue>,
          nextValue as Record<string, CiSettingsValue>,
          path,
        );
        continue;
      }

      const allowed = canOverride
        ? await canOverride({
            settingsId,
            path,
            fromLayer,
            toLayer,
            tenantId,
            userId,
            currentValue,
            nextValue,
          })
        : true;

      if (allowed) {
        output[key] = ciCloneSettingsValue(nextValue);
      }
    }

    return output;
  };

  return (await mergeObject(
    baseValue as Record<string, CiSettingsValue>,
    incomingValue as Record<string, CiSettingsValue>,
  )) as TSettings;
}
