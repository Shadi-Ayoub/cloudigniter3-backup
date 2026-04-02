import type { CiCanOverrideSettingsValue } from '../../common/types/CiCanOverrideSettingsValue';
import type { CiSettingsContext } from '../../common/types/CiSettingsContext';
import type { CiSettingsRegistry } from '../../common/types/CiSettingsRegistry';
import type { CiSettingsScope } from '../../common/types/CiSettingsScope';

/**
 * Input for resolved settings reads.
 */
export type CiGetResolvedSettingsInput = {
  registry: CiSettingsRegistry;
  settingsId: string;
  scope: CiSettingsScope;
  context?: CiSettingsContext;
  canOverride?: CiCanOverrideSettingsValue;
};
