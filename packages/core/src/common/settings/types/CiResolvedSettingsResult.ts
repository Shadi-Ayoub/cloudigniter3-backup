import type { CiLoadedSettingsLayers } from './CiLoadedSettingsLayers';
import type { CiScopedSettingsScope } from './CiScopedSettingsScope';
import type { CiSettings } from './CiSettings';
import type { CiSettingsScope } from './CiSettingsScope';

/**
 * Successful resolved settings payload.
 */
export type CiResolvedSettingsResult<TSettings extends CiSettings = CiSettings> = {
  settingsId: string;
  scope: CiSettingsScope;
  scopedScope: CiScopedSettingsScope;
  defaults: TSettings;
  value: TSettings;
  layers: CiLoadedSettingsLayers<TSettings>;
};
