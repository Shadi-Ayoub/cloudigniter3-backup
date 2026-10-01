import type { CiThemeAttributeStrategy } from "./CiThemeAttributeStrategy";

/**
 * Framework-agnostic theme contract.
 *
 * This type describes theme behavior without coupling it to Next.js,
 * React provider implementations, or next-themes.
 */
export type CiThemeConfig<TTheme extends string = string> = {
  /**
   * Legacy system-preference flag. Used when useSystemPreference is omitted.
   * The switcher follows the effective provider configuration.
   */
  enableSystem?: boolean;

  /**
   * Default active theme name.
   *
   * Examples:
   * - "light"
   * - "dark"
   * - "corporate"
   */
  defaultTheme?: TTheme;

  /**
   * Whether system color preference should be observed.
   */
  useSystemPreference?: boolean;

  /**
   * Whether browser color-scheme should be synchronized.
   */
  enableColorScheme?: boolean;

  /**
   * Disable CSS transitions during theme switching.
   */
  disableTransitionOnChange?: boolean;

  /**
   * Supported theme names.
   */
  supportedThemes?: TTheme[];

  /**
   * DOM strategy used to apply the theme.
   *
   * Examples:
   * - "class"
   * - "data-theme"
   */
  attributeStrategy?: CiThemeAttributeStrategy;

  /**
   * Mapping from logical theme names to DOM attribute values.
   */
  themeValueMap?: Record<TTheme, string>;

  /**
   * Storage key used to persist the active theme.
   */
  storageKey?: string;

  /**
   * CSP nonce for adapters that inject client-side scripts.
   */
  nonce?: string;

  /**
   * Optional adapter-agnostic extension bag.
   */
  metadata?: Record<string, unknown>;
};

export type CiThemeSettings = CiThemeConfig;
