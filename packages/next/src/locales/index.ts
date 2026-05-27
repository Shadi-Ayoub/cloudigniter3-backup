import ar_common from "./ar/common.json";
import ar_dashboard from "./ar/dashboard.json";
import ar_home from "./ar/home.json";
import ar_public from "./ar/public.json";
import ar_dev from "./ar/dev.json";
import ar_system_settings from "./ar/system-settings.json";
import ar_tenants from "./ar/tenants.json";

import en_common from "./en/common.json";
import en_dashboard from "./en/dashboard.json";
import en_home from "./en/home.json";
import en_public from "./en/public.json";
import en_dev from "./en/dev.json";
import en_system_settings from "./en/system-settings.json";
import en_tenants from "./en/tenants.json";

const locales: {
  [locale: string]: {
    [file: string]: object;
  };
} = {
  ar: {
    common: ar_common,
    dashboard: ar_dashboard,
    home: ar_home,
    public: ar_public,
    dev: ar_dev,
    "system-settings": ar_system_settings,
    tenants: ar_tenants,
  },
  en: {
    common: en_common,
    dashboard: en_dashboard,
    home: en_home,
    public: en_public,
    dev: en_dev,
    "system-settings": en_system_settings,
    tenants: en_tenants,
  },
};

export { locales };
