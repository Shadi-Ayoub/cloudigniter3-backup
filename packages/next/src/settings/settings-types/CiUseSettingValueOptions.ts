import type { CiSettingsValue } from '../../../common/types';

/**
 * Options for `useSettingValue`.
 */
export type CiUseSettingValueOptions<TValue = CiSettingsValue> = {
  /**
   * Dot-separated path under the selected settings object.
   */
  path: string;

  /**
   * Optional top-level settings id.
   */
  settingsId?: string;

  /**
   * Optional fallback value when the path cannot be resolved.
   */
  fallbackValue?: TValue;
};
