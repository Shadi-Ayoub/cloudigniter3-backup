import type { CiSettingsValue } from '../../common/types/CiSettingsValue';

/**
 * Options for the `useSettingValue` hook.
 */
export type CiUseSettingValueOptions = {
  settingsId: string;
  path: string;
  fallback?: CiSettingsValue;
  enabled?: boolean;
};
