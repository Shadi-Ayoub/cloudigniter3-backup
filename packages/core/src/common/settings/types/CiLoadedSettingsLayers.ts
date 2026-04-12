import type { CiSettings } from './CiSettings';

/**
 * Loaded settings layers used while building a resolved settings object.
 */
export type CiLoadedSettingsLayers<TSettings extends CiSettings = CiSettings> = {
  defaults: TSettings;
  system?: Partial<TSettings>;
  global?: Partial<TSettings>;
  tenant?: Partial<TSettings>;
  user?: Partial<TSettings>;
};
