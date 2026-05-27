import type { ReactNode } from "react";
import type { CiNextThemeConfig } from "./CiNextThemeConfig";

export type CiThemeProviderProps<TTheme extends string = string> = {
  children: ReactNode;
  config?: CiNextThemeConfig<TTheme>;
};
