"use client";

import { useMemo } from "react";
import { useTheme as useAmplifyTheme, type Theme } from "@aws-amplify/ui-react";
import { deepmerge } from "deepmerge-ts";

import { ciBuildDefaultThemeFromTokens } from "./ci-build-default-theme-from-tokens";

import type {
  CiAuthenticatorThemeMode,
  CiAuthenticatorThemeOverride,
} from "./types";

export function useCiAmplifyAuthenticatorTheme(
  mode?: CiAuthenticatorThemeMode,
  override?: CiAuthenticatorThemeOverride,
  merge = true,
): Theme {
  const { tokens } = useAmplifyTheme();

  return useMemo(() => {
    const base = ciBuildDefaultThemeFromTokens(tokens, mode);

    const merged = override
      ? merge
        ? deepmerge(base, override)
        : override
      : base;

    return {
      ...merged,
      name: merged.name || base.name,
    } as Theme;
  }, [tokens, mode, override, merge]);
}

// 'use client';

// import * as React from 'react';
// import { useTheme as useAmplifyTheme, type Theme } from '@aws-amplify/ui-react';
// import { deepmerge } from 'deepmerge-ts';
// import { useTheme as useNextTheme } from 'next-themes';

// import { ciBuildDefaultThemeFromTokens } from './ci-build-default-theme-from-tokens';

// export type AuthenticatorThemeOverride = Partial<Theme>;

// export function useCiAuthenticatorTheme(override?: AuthenticatorThemeOverride, merge: boolean = true): Theme {
//   const { tokens } = useAmplifyTheme();
//   const { theme } = useNextTheme();

//   return React.useMemo(() => {
//     const base = ciBuildDefaultThemeFromTokens(tokens, theme);
//     const merged = override ? (merge ? deepmerge(base, override) : override) : base;

//     return {
//       ...merged,
//       name: merged.name || base.name,
//     } as Theme;
//   }, [tokens, override]);
// }
