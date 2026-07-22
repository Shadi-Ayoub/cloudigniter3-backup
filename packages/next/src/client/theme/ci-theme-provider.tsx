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
  // https://github.com/shadcn-ui/ui/issues/10200#issuecomment-4470864791
  // React 19 / Next 16 fix: suppress the <script> tag warning by
  // telling next-themes to use type="application/json" instead of
  // type="text/javascript", which React won't try to execute
  const scriptProps =
    typeof window === "undefined"
      ? undefined
      : ({ type: "application/json" } as const);

  const ciThemeProviderProps = ciResolveNextThemeProviderProps(config);

  return (
    <ThemeProvider {...ciThemeProviderProps} scriptProps={scriptProps}>
      {children}
    </ThemeProvider>
  );
}
