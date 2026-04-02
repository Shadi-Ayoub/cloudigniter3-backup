import type { CiSettingsDefinition } from "../common/types/CiSettingsDefinition";
import type { CiSettingsRegistry } from "../common/types/CiSettingsRegistry";

/**
 * Resolve a required settings definition from the registry.
 *
 * @param registry - Settings registry.
 * @param settingsId - Settings identifier.
 * @returns Matching definition.
 * @throws Error when the definition is not registered.
 */
export function ciGetRequiredSettingsDefinition(
  registry: CiSettingsRegistry,
  settingsId: string,
): CiSettingsDefinition {
  const ciDefinition = registry[settingsId];

  if (!ciDefinition) {
    throw new Error(`Settings definition "${settingsId}" is not registered.`);
  }

  return ciDefinition;
}
