import type { CiGeneralSettings } from "./CiGeneralSettings";
import type { CiI18nSettings, CiThemeSettings } from "@ci-core/types";

export type CiPublicCoreSettings = {
  general: CiGeneralSettings;
  i18n: CiI18nSettings;
  theme: CiThemeSettings;
};
