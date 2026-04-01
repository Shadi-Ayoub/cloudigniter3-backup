import { useMemo } from 'react';
import { ciGetSettingsValueAtPath } from '../common/ci-get-settings-value-at-path';
import type { CiSettings } from '../common/types';
import { useSettings } from './use-settings';
import type { CiUseSettingValueOptions, CiUseSettingValueResult } from './types';

/**
 * Read one nested value from resolved settings.
 *
 * @param options - Hook options.
 * @returns Hook state for the selected nested value.
 */
export function useSettingValue(
  options: CiUseSettingValueOptions,
): CiUseSettingValueResult {
  const { settingsId, path, fallback, enabled } = options;
  const settings = useSettings<CiSettings>({
    settingsId,
    enabled,
  });

  return useMemo(
    () => ({
      data:
        settings.data ? ciGetSettingsValueAtPath(settings.data, path) ?? fallback : fallback,
      isLoading: settings.isLoading,
      error: settings.error,
      refresh: settings.refresh,
    }),
    [fallback, path, settings],
  );
}
