// https://ui.docs.amplify.aws/react/theming

// import { useTheme } from '@aws-amplify/ui-react';
import type { Theme } from '@aws-amplify/ui-react';

import type { CiAmplifyTokens } from '@cloudigniter/next/utility/client';

export function buildCustomAuthenticatorThemeFromTokens(
  tokens: CiAmplifyTokens
) {
  const theme: Theme = {
    name: 'Auth Custom Theme',
    tokens: tokens ?? {},
  };

  return theme;
}
