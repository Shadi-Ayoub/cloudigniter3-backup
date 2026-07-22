import type { CiLocaleDirection } from "./CiLocaleDirection";
import type { CiI18nConfig } from "./CiI18nConfig";

export interface CiLocaleSwitcherSelectProps {
  dir: CiLocaleDirection;
  menuItems: {
    key: string;
    label: string;
  }[];
  defaultValue: string;
  config: CiI18nConfig;
}
