import type { CiSettingsValue } from '../common/types';

/**
 * Deep-clone a settings value using JSON-compatible recursion.
 *
 * @param value - Value to clone.
 * @returns Cloned value.
 */
export function ciCloneSettingsValue<TValue extends CiSettingsValue>(value: TValue): TValue {
  if (Array.isArray(value)) {
    return value.map((item) => ciCloneSettingsValue(item)) as TValue;
  }

  if (value && typeof value === 'object') {
    const output: Record<string, CiSettingsValue> = {};
    for (const [key, item] of Object.entries(value)) {
      output[key] = ciCloneSettingsValue(item);
    }
    return output as TValue;
  }

  return value;
}
