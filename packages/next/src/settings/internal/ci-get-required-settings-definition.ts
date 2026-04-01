import type { CiSettingsDefinition, CiSettingsRegistry } from '../common/types';

/**
 * Look up a settings definition and throw if it does not exist.
 *
 * @param registry - Settings registry to search.
 * @param settingsId - Settings identifier to resolve.
 * @returns Matching settings definition.
 * @throws Error when the definition is not registered.
 */
export function ciGetRequiredSettingsDefinition(
  registry: CiSettingsRegistry,
  settingsId: string,
): CiSettingsDefinition {
  const definition = registry[settingsId];
  if (!definition) {
    throw new Error(`Settings definition "${settingsId}" is not registered.`);
  }

  return definition;
}
