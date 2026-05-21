import type { CiI18nConfig } from "./CiI18nConfig";

export interface CiLocaleSwitcherSelectProps {
  dir: "ltr" | "rtl";
  menuItems: {
    key: string;
    label: string;
  }[];
  defaultValue: string;
  config: CiI18nConfig;
}
