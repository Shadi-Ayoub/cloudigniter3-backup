import type { CiSettingsLayerName } from './CiSettingsLayerName';
import type { CiSettingsValue } from './CiSettingsValue';

/**
 * Input delivered to the override policy callback.
 */
export type CiCanOverrideSettingsValueInput = {
  settingsId: string;
  path: string;
  fromLayer: CiSettingsLayerName;
  toLayer: CiSettingsLayerName;
  tenantId?: string;
  userId?: string;
  currentValue?: CiSettingsValue;
  nextValue: CiSettingsValue;
};
