import type { CiThemeConfig } from "@cloudigniter/core/types";
import type { ThemeProviderProps } from "next-themes";

/**
 * Maps a framework-agnostic CloudIgniter theme config
 * into next-themes provider props.
 */
export function ciMapThemeConfigToNextThemeProviderProps<
  TTheme extends string = string,
>(input?: CiThemeConfig<TTheme>): Omit<ThemeProviderProps, "children"> {
  const props: Omit<ThemeProviderProps, "children"> = {
    defaultTheme: input?.defaultTheme,
    enableSystem: input?.useSystemPreference ?? input?.enableSystem,
    enableColorScheme: input?.enableColorScheme,
    disableTransitionOnChange: input?.disableTransitionOnChange,
    themes: input?.supportedThemes,
    attribute: input?.attributeStrategy,
    value: input?.themeValueMap,
    storageKey: input?.storageKey,
    nonce: input?.nonce,
  };

  // Missing optional fields must not erase CloudIgniter's defaults.
  return Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined),
  );
}
