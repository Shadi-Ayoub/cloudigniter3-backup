import type { CiSettings, CiSettingsValue } from '../common/types';

/**
 * Options for the `useSettings` hook.
 */
export type CiUseSettingsOptions<TSettings extends CiSettings = CiSettings> = {
  /** Resolved settings identifier. */
  settingsId: string;
  /** Optional fallback value. */
  fallback?: TSettings;
  /** Whether the hook should actively load data. */
  enabled?: boolean;
  /** Optional preloaded resolved value. */
  initialValue?: TSettings;
};

/**
 * Result returned by the `useSettings` hook.
 */
export type CiUseSettingsResult<TSettings extends CiSettings = CiSettings> = {
  /** Resolved settings value. */
  data: TSettings | undefined;
  /** Whether loading is in progress. */
  isLoading: boolean;
  /** Optional error message. */
  error?: string;
  /** Manual refresh callback placeholder. */
  refresh: () => Promise<void>;
};

/**
 * Options for the `useSettingValue` hook.
 */
export type CiUseSettingValueOptions = {
  /** Resolved settings identifier. */
  settingsId: string;
  /** Dot-separated path to read. */
  path: string;
  /** Optional fallback value. */
  fallback?: CiSettingsValue;
  /** Whether loading is enabled. */
  enabled?: boolean;
};

/**
 * Result returned by the `useSettingValue` hook.
 */
export type CiUseSettingValueResult = {
  /** Resolved nested value. */
  data: CiSettingsValue | undefined;
  /** Whether loading is in progress. */
  isLoading: boolean;
  /** Optional error message. */
  error?: string;
  /** Manual refresh callback placeholder. */
  refresh: () => Promise<void>;
};
