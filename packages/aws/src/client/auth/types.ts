import { useTheme, type Theme } from "@aws-amplify/ui-react";

export type CiAmplifyTokens = ReturnType<typeof useTheme>["tokens"];

export type CiAuthenticatorThemeOverride = Partial<Theme>;

export type CiAuthenticatorThemeMode = string | undefined;
