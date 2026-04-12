import type { CiSettings, CiSettingsValue } from './types';

/**
 * Deep-merge two settings objects.
 *
 * Arrays are replaced rather than concatenated. Objects are merged
 * recursively. Primitive values overwrite the previous value.
 *
 * @param baseValue - Existing settings object.
 * @param nextValue - Incoming settings object.
 * @returns Merged settings object.
 */
export function ciMergeSettings<TSettings extends CiSettings>(
  baseValue: TSettings,
  nextValue: Partial<TSettings>,
): TSettings {
  const mergeValue = (left: CiSettingsValue, right: CiSettingsValue): CiSettingsValue => {
    if (
      left &&
      right &&
      typeof left === 'object' &&
      typeof right === 'object' &&
      !Array.isArray(left) &&
      !Array.isArray(right)
    ) {
      const output: Record<string, CiSettingsValue> = { ...(left as Record<string, CiSettingsValue>) };
      for (const [key, value] of Object.entries(right)) {
        const current = output[key];
        output[key] = current === undefined ? value : mergeValue(current, value);
      }
      return output;
    }

    if (Array.isArray(right)) {
      return [...right];
    }

    return right;
  };

  return mergeValue(baseValue, nextValue as CiSettingsValue) as TSettings;
}
