"use client";

import { useEffect } from "react";
import { ThemeProvider, useTheme } from "next-themes";

import { ciResolveNextThemeProviderProps } from "@ci-next/lib";
import type { CiThemeProviderProps } from "@ci-next/types";

function CiThemePreferenceGuard({
  enableSystem,
  defaultTheme,
  settingsPreference,
}: {
  enableSystem?: boolean;
  defaultTheme?: string;
  settingsPreference?: string;
}) {
  const { theme, themes, setTheme, forcedTheme } = useTheme();

  useEffect(() => {
    if (!settingsPreference || forcedTheme) return;
    const cookie = document.cookie.split("; ").find(item => item.startsWith("ci-theme="));
    const preferred = cookie ? decodeURIComponent(cookie.slice("ci-theme=".length)) : settingsPreference;
    if (themes.includes(preferred) && theme !== preferred) setTheme(preferred);
  }, [settingsPreference, theme, themes, forcedTheme, setTheme]);

  useEffect(() => {
    // A saved system preference can outlive an application's configuration.
    if (enableSystem === false && theme === "system") {
      setTheme(defaultTheme ?? "light");
    }
  }, [enableSystem, defaultTheme, theme, setTheme]);

  return null;
}
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
      <CiThemePreferenceGuard
        enableSystem={ciThemeProviderProps.enableSystem}
        defaultTheme={ciThemeProviderProps.defaultTheme}
        settingsPreference={config?.settingsPreference}
      />
      {children}
    </ThemeProvider>
  );
}
