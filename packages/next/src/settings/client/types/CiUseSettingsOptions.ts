import type { CiSettings } from "@cloudigniter/core";

/**
 * Options for the `useSettings` hook.
 */
export type CiUseSettingsOptions<TSettings extends CiSettings = CiSettings> = {
  settingsId: string;
  fallback?: TSettings;
  enabled?: boolean;
  initialValue?: TSettings;
};
