'use client';

import { useTheme } from '@aws-amplify/ui-react';

import { Page } from '@cloudigniter/next/ui/layout';
import { LoginPage } from '@cloudigniter/next/ui/pages';
import {
  buildAuthenticatorProps,
  useAuthenticatorTheme,
} from '@cloudigniter/next/utility/client';
import type { CiAmplifyOutputs, CiPageConfig } from '@cloudigniter/next/types';

// import { getConfig } from '@/kernel';
import {
  authenticatorCustomProps,
  buildCustomAuthenticatorThemeFromTokens,
} from '@/custom/authenticator';
import outputs from '@/../amplify_outputs.json';

const amplifyOutputs = outputs as CiAmplifyOutputs;

interface LoginPageClientWrapperInterface {
  config: CiPageConfig;
}

export function LoginPageClientWrapper({
  config,
}: LoginPageClientWrapperInterface) {
  const { tokens } = useTheme();

  const authenticatorCustomTheme =
    buildCustomAuthenticatorThemeFromTokens(tokens);

  // const ciConfig = getConfig();
  const merge = config.ciConfig.authenticator.custom.merge;

  const theme = useAuthenticatorTheme(authenticatorCustomTheme, merge);
  const props = buildAuthenticatorProps(authenticatorCustomProps);

  return (
    <Page
      name={'dashboard-homepage'}
      setup={{
        showPageHeader: false,
        layoutHasHeader: false,
        layoutHasFooter: false,
      }}
      config={config}
      login={true}
    >
      <LoginPage
        outputs={amplifyOutputs}
        authenticatorProps={props}
        authenticatorStyleTheme={theme}
        authenticatorConfig={config.ciConfig.authenticator}
      />
    </Page>
  );
}
