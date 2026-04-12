import type { CiSettingsValue } from "@cloudigniter/core";

/**
 * Result returned by the `useSettingValue` hook.
 */
export type CiUseSettingValueResult = {
  data: CiSettingsValue | undefined;
  isLoading: boolean;
  error?: string;
  refresh: () => Promise<void>;
};
