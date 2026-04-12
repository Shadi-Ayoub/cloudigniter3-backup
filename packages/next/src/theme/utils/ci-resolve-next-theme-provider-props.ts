import type { ThemeProviderProps } from "next-themes";
import type { CiNextThemeConfig } from "../types/CiNextThemeConfig";
import { ciMapThemeConfigToNextThemeProviderProps } from "./ci-map-theme-config-to-next-theme-provider-props";
import { CI_DEFAULT_NEXT_THEME_PROVIDER_PROPS } from "../constants";

/**
 * Resolves final next-themes provider props by combining:
 * 1. CloudIgniter defaults
 * 2. mapped framework-agnostic theme config
 * 3. explicit raw next-themes overrides
 *
 * Precedence increases in that order.
 */
export function ciResolveNextThemeProviderProps<TTheme extends string = string>(
  input?: CiNextThemeConfig<TTheme>,
): Omit<ThemeProviderProps, "children"> {
  const ciMappedProps = ciMapThemeConfigToNextThemeProviderProps(input?.theme);

  return {
    ...CI_DEFAULT_NEXT_THEME_PROVIDER_PROPS,
    ...ciMappedProps,
    ...input?.themeProviderProps,
  };
}
