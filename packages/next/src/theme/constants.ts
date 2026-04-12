import type { ThemeProviderProps } from "next-themes";

/**
 * Default next-themes props used when the caller does not provide overrides.
 */
export const CI_DEFAULT_NEXT_THEME_PROVIDER_PROPS: Omit<
  ThemeProviderProps,
  "children"
> = {
  attribute: "class",
  defaultTheme: "system",
  enableSystem: true,
  enableColorScheme: true,
  storageKey: "ci-theme",
};
