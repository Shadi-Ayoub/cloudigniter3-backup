import type { CiSettingsValue } from "@cloudigniter/core";

/**
 * Deep-clone a settings value.
 *
 * @param value - Value to clone.
 * @returns Cloned value with the same static type.
 */
export function ciCloneSettingsValue<TValue extends CiSettingsValue>(
  value: TValue,
): TValue {
  if (Array.isArray(value)) {
    return value.map((item) => ciCloneSettingsValue(item)) as TValue;
  }

  if (value && typeof value === "object") {
    const ciOutput: Record<string, CiSettingsValue> = {};

    for (const [key, item] of Object.entries(value)) {
      ciOutput[key] = ciCloneSettingsValue(item);
    }

    return ciOutput as TValue;
  }

  return value;
}
