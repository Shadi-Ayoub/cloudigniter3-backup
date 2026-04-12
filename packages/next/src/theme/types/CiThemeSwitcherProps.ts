import type { CiResolvedPageConfig } from "@/.";

export interface CiThemeSwitcherProps {
  dir: "ltr" | "rtl";
  config: CiResolvedPageConfig;
}
