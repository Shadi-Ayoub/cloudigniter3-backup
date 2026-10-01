import type { AbstractIntlMessages } from "next-intl";

import arCommon from "./ar/common.json";
import arDashboard from "./ar/dashboard.json";
import arDashboardModules from "./ar/dashboard-modules.json";
import arDashboardSettings from "./ar/dashboard-settings.json";

import enCommon from "./en/common.json";
import enDashboard from "./en/dashboard.json";
import enDashboardModules from "./en/dashboard-modules.json";
import enDashboardSettings from "./en/dashboard-settings.json";

const locales = {
  ar: {
    common: arCommon,
    dashboard: arDashboard,
    "dashboard-modules": arDashboardModules,
    "dashboard-settings": arDashboardSettings,
  },

  en: {
    common: enCommon,
    dashboard: enDashboard,
    "dashboard-modules": enDashboardModules,
    "dashboard-settings": enDashboardSettings,
  },
} satisfies Record<string, Record<string, AbstractIntlMessages>>;

export { locales };
