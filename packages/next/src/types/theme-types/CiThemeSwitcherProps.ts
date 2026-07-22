import type { CiNextPageConfig } from "@ci-next/types";
import type { CiLocaleDirection } from "@cloudigniter/core/types";

export interface CiThemeSwitcherProps {
  dir: CiLocaleDirection;
  config: CiNextPageConfig;
}
