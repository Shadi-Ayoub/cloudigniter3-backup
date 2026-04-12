import { useMemo, useState } from "react";
import type { CiSettings } from "@cloudigniter/core";
import type { CiUseSettingsOptions, CiUseSettingsResult } from "./types";

/**
 * Minimal client hook for resolved settings consumption.
 *
 * This reference implementation is intentionally light. In a real application,
 * wire this hook to your server endpoint or data-fetching layer.
 *
 * @param options - Hook options.
 * @returns Hook state.
 */
export function useCiSettings<TSettings extends CiSettings = CiSettings>(
  options: CiUseSettingsOptions<TSettings>,
): CiUseSettingsResult<TSettings> {
  const { fallback, enabled = true, initialValue } = options;
  const [data] = useState<TSettings | undefined>(initialValue ?? fallback);
  const [error] = useState<string | undefined>(undefined);

  return useMemo(
    () => ({
      data,
      isLoading: enabled ? false : false,
      error,
      refresh: async () => undefined,
    }),
    [data, enabled, error],
  );
}
