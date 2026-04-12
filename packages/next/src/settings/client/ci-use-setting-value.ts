import { useMemo } from "react";
import { ciGetSettingsValueAtPath, type CiSettings } from "@cloudigniter/core";
import { useCiSettings } from "./ci-use-settings";
import type {
  CiUseSettingValueOptions,
  CiUseSettingValueResult,
} from "./types";

/**
 * Read one nested value from resolved settings.
 *
 * @param options - Hook options.
 * @returns Hook state for the selected nested value.
 */
export function useCiSettingValue(
  options: CiUseSettingValueOptions,
): CiUseSettingValueResult {
  const { settingsId, path, fallback, enabled } = options;
  const settings = useCiSettings<CiSettings>({
    settingsId,
    enabled,
  });

  return useMemo(
    () => ({
      data: settings.data
        ? ciGetSettingsValueAtPath(settings.data, path) ?? fallback
        : fallback,
      isLoading: settings.isLoading,
      error: settings.error,
      refresh: settings.refresh,
    }),
    [fallback, path, settings],
  );
}
