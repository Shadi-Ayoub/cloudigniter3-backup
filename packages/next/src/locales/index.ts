import ar_common from "./ar/common.json";
import ar_dashboard from "./ar/dashboard.json";
import ar_dev from "./ar/dashboard-dev.json";
import ar_home from "./ar/home.json";
import ar_settings from "./ar/dashboard-settings.json";
import ar_tenants from "./ar/dashboard-tenants.json";
import ar_theme from "./ar/dashboard-theme.json";

import en_common from "./en/common.json";
import en_dashboard from "./en/dashboard.json";
import en_dev from "./en/dashboard-dev.json";
import en_home from "./en/home.json";
import en_settings from "./en/dashboard-settings.json";
import en_tenants from "./en/dashboard-tenants.json";
import en_theme from "./en/dashboard-theme.json";

const locales: {
  [locale: string]: {
    [file: string]: object;
  };
} = {
  ar: {
    common: ar_common,
    dashboard: ar_dashboard,
    "dashboard-dev": ar_dev,
    home: ar_home,
    "dashboard-settings": ar_settings,
    "dashboard-tenants": ar_tenants,
    "dashboard-theme": ar_theme,
  },
  en: {
    common: en_common,
    dashboard: en_dashboard,
    "dashboard-dev": en_dev,
    home: en_home,
    "dashboard-settings": en_settings,
    "dashboard-tenants": en_tenants,
    "dashboard-theme": en_theme,
  },
};

export { locales };
