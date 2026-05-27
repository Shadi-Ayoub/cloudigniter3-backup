"use client";

import { type Theme } from "@aws-amplify/ui-react";
import { useTheme as useNextTheme } from "next-themes";

import {
  useCiAmplifyAuthenticatorTheme,
  type CiAuthenticatorThemeOverride,
} from "@cloudigniter/aws/client";

export function useCiNextAwsAuthenticatorTheme(
  override?: CiAuthenticatorThemeOverride,
  merge = true,
): Theme {
  const { resolvedTheme } = useNextTheme();

  return useCiAmplifyAuthenticatorTheme(resolvedTheme, override, merge);
}
