import type { CiSettingsValue } from "@cloudigniter/core";

/**
 * Options for the `useSettingValue` hook.
 */
export type CiUseSettingValueOptions = {
  settingsId: string;
  path: string;
  fallback?: CiSettingsValue;
  enabled?: boolean;
};
