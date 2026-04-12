import type { CiThemeConfig } from "@cloudigniter/core";
import type { ThemeProviderProps } from "next-themes";

/**
 * Maps a framework-agnostic CloudIgniter theme config
 * into next-themes provider props.
 */
export function ciMapThemeConfigToNextThemeProviderProps<
  TTheme extends string = string,
>(input?: CiThemeConfig<TTheme>): Omit<ThemeProviderProps, "children"> {
  return {
    defaultTheme: input?.defaultTheme,
    enableSystem: input?.useSystemPreference,
    enableColorScheme: input?.enableColorScheme,
    disableTransitionOnChange: input?.disableTransitionOnChange,
    themes: input?.supportedThemes,
    attribute: input?.attributeStrategy,
    value: input?.themeValueMap,
    storageKey: input?.storageKey,
    nonce: input?.nonce,
  };
}
