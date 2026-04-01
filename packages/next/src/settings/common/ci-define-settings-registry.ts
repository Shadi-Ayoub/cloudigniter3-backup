import type { CiSettingsRegistry } from './types';

/**
 * Create a settings registry object.
 *
 * The registry is intentionally a plain object so package consumers can define
 * and export it without runtime ceremony.
 *
 * @returns New empty settings registry.
 */
export function ciDefineSettingsRegistry<TRegistry extends CiSettingsRegistry>(
  registry: TRegistry,
): TRegistry {
  return registry;
}
