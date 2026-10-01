"use client";

import { type Theme } from "@aws-amplify/ui-react";
import { useCiColorMode } from "@cloudigniter/ui/client";

import {
  useCiAmplifyAuthenticatorTheme,
  type CiAuthenticatorThemeOverride,
} from "@cloudigniter/aws/client";

export function useCiNextAwsAuthenticatorTheme(
  override?: CiAuthenticatorThemeOverride,
  merge = true,
): Theme {
  const colorMode = useCiColorMode();

  return useCiAmplifyAuthenticatorTheme(colorMode, override, merge);
}
