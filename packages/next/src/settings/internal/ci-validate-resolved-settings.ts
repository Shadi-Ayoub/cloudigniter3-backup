import type { CiSettings, CiSettingsDefinition } from '../common/types';

/**
 * Validate a resolved settings object against its definition schema, when one
 * is registered.
 *
 * @param definition - Settings definition.
 * @param value - Resolved settings value.
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
