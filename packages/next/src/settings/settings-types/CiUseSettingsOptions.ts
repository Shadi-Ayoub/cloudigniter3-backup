/**
 * Options for `useSettings`.
 *
 * - without `settingsId`, the hook returns the whole settings map
 * - with `settingsId`, the hook returns the selected domain object
 */
export type CiUseSettingsOptions<TValue = unknown> = {
  /**
   * Optional settings id to select a specific top-level settings domain.
   */
  settingsId?: string;

  /**
   * Optional fallback value when the requested result is unavailable.
   */
  fallbackValue?: TValue;
};
