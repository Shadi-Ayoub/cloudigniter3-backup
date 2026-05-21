import type { CiI18nConfig, CiLocale, CiTraceConfig } from "@/types";

export interface CiLocaleSwitcherProps {
  traceConfig?: CiTraceConfig;
  menuItems: {
    key: string;
    label: string; // translated by the framework package
  }[];
  locale?: CiLocale; // current locale object
  config: CiI18nConfig; // system locale configuration
}
