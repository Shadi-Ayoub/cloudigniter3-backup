"use client";

import { ThemeProvider } from "next-themes";

import { ciResolveNextThemeProviderProps } from "@ci-next/lib";
import type { CiThemeProviderProps } from "@ci-next/types";
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
