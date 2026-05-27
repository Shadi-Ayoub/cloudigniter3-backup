import type { ThemeProviderProps } from "next-themes";

/**
 * Next.js-specific ThemeProvider options.
 *
 * This acts as an escape hatch for raw next-themes configuration.
 */
export type CiThemeProviderConfig = {
  themeProviderProps?: Omit<ThemeProviderProps, "children">;
};
