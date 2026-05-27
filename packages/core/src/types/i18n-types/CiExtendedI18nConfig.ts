import type { CiSettingsValue } from "@ci-core/types";
import type { CiLocale } from "./CiLocale";
import type { CiI18nConfig } from "./CiI18nConfig";

// Extended Locale configurations
export type CiExtendedI18nConfig = CiLocale & {
  config: CiI18nConfig;
} & Partial<Record<string, CiSettingsValue>>;
