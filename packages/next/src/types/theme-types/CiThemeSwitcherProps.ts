import type { CiNextPageConfig } from "@ci-next/types";

export interface CiThemeSwitcherProps {
  dir: "ltr" | "rtl";
  config: CiNextPageConfig;
}
