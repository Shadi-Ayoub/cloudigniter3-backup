// https://ui.docs.amplify.aws/react/theming

import type { CiAuthenticatorThemeOverride } from "@cloudigniter/aws/client";

export function buildCustomAmplifyAuthenticatorThemeOverride(): CiAuthenticatorThemeOverride {
  return {
    name: "Auth Custom Theme",
    tokens: {
      // your custom Amplify theme overrides here
    },
  };
}
