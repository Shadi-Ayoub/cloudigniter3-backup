"use client";

import type { CiSettings, CiUseSettingsResult } from "@cloudigniter/core/types";
import { ciUseSettingsContext } from "./ci-settings-provider";

export function useCiSettings<
  TSettings extends CiSettings = CiSettings,
>(): CiUseSettingsResult<TSettings> {
  return ciUseSettingsContext<TSettings>();
}
