import type { CiSettings } from './CiSettings';

/**
 * Minimal schema-like contract used by the settings registry.
 */
export type CiSettingsSchema<TSettings extends CiSettings = CiSettings> = {
  parse: (value: unknown) => TSettings;
};
