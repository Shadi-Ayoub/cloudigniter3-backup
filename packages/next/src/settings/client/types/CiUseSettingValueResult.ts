import type { CiSettingsValue } from '../../common/types/CiSettingsValue';

/**
 * Result returned by the `useSettingValue` hook.
 */
export type CiUseSettingValueResult = {
  data: CiSettingsValue | undefined;
  isLoading: boolean;
  error?: string;
  refresh: () => Promise<void>;
};
