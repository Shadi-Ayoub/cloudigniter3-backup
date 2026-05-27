import type { CiSettingsValue } from "@ci-core/types";
import type { CiLocale } from "./CiLocale";
import type { CiI18nConfig } from "./CiI18nConfig";
export type CiExtendedI18nConfig = CiLocale & {
    config: CiI18nConfig;
} & Partial<Record<string, CiSettingsValue>>;
//# sourceMappingURL=CiExtendedI18nConfig.d.ts.map