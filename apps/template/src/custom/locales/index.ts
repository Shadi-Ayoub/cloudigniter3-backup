import type { AbstractIntlMessages } from "next-intl";

import arCommon from "./ar/common.json";
import arDashboard from "./ar/dashboard.json";
import arDashboardSettings from "./ar/dashboard-settings.json";

import enCommon from "./en/common.json";
import enDashboard from "./en/dashboard.json";
import enDashboardSettings from "./en/dashboard-settings.json";

const locales = {
  ar: {
    common: arCommon,
    dashboard: arDashboard,
    "dashboard-settings": arDashboardSettings,
  },

  en: {
    common: enCommon,
    dashboard: enDashboard,
    "dashboard-settings": enDashboardSettings,
  },
} satisfies Record<string, Record<string, AbstractIntlMessages>>;

export { locales };
