import type { CiThemeConfig } from "@cloudigniter/core/types";
import type { CiThemeProviderConfig } from "./CiThemeProviderConfig";

/**
 * Combined Next.js theme configuration.
 *
 * - theme: framework-agnostic CloudIgniter theme contract
 * - themeProviderProps: raw next-themes overrides
 */
export type CiNextThemeConfig<TTheme extends string = string> = {
  theme?: CiThemeConfig<TTheme>;
} & CiThemeProviderConfig;
