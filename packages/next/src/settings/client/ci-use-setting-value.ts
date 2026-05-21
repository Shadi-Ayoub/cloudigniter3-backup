"use client";

import { ciGetSettingsValueAtPath } from "@cloudigniter/core";
import {
  type CiSettings,
  type CiUseSettingValueResult,
} from "@cloudigniter/core/types";
import { useCiSettings } from "./ci-use-settings";

export function useCiSettingValue<TValue = unknown>(
  path: string,
): CiUseSettingValueResult<TValue> {
  const { settings } = useCiSettings<CiSettings>();

  return {
    value: ciGetSettingsValueAtPath<TValue>(settings, path),
  };
}
