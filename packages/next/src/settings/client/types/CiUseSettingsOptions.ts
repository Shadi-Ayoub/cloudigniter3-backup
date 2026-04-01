import type { CiSettings } from '../../common/types/CiSettings';

/**
 * Options for the `useSettings` hook.
 */
export type CiUseSettingsOptions<TSettings extends CiSettings = CiSettings> = {
  settingsId: string;
  fallback?: TSettings;
  enabled?: boolean;
  initialValue?: TSettings;
};
