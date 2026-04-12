import type { CiI18nConfig } from "../../";

export interface CiLocaleSwitcherSelectProps {
  dir: "ltr" | "rtl";
  menuItems: {
    key: string;
    label: string;
  }[];
  defaultValue: string;
  config: CiI18nConfig;
}
