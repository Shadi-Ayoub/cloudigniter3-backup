"use client";

import { ThemeProvider } from "next-themes";

import { ciResolveNextThemeProviderProps } from "../utils/ci-resolve-next-theme-provider-props";
import type { CiThemeProviderProps } from "../types";
/**
 * CloudIgniter Next.js theme provider.
 *
 * This wraps next-themes while allowing callers to configure
 * theme behavior through the framework-agnostic CloudIgniter contract.
 */
export function CiThemeProvider<TTheme extends string = string>({
  children,
  config,
}: CiThemeProviderProps<TTheme>) {
  const ciThemeProviderProps = ciResolveNextThemeProviderProps(config);

  return <ThemeProvider {...ciThemeProviderProps}>{children}</ThemeProvider>;
}
