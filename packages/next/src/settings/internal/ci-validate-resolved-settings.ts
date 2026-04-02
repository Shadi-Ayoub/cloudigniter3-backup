import type { CiSettings } from "../common/types/CiSettings";
import type { CiSettingsDefinition } from "../common/types/CiSettingsDefinition";

/**
 * Validate a fully resolved settings object against its schema, when present.
 *
 * @param definition - Settings definition.
 * @param value - Final resolved settings value.
 * @returns Validated settings value.
 */
export function ciValidateResolvedSettings<TSettings extends CiSettings>(
  definition: CiSettingsDefinition<TSettings>,
  value: TSettings,
): TSettings {
  if (!definition.schema) {
    return value;
  }

  return definition.schema.parse(value);
}
