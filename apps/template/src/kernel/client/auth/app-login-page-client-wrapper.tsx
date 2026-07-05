"use client";

import {
  CiPage,
  useCiNextAwsAuthenticatorTheme,
} from "@cloudigniter/next/client";
import { CiNextAwsLoginPage } from "@cloudigniter/next/ui/client";
import { ciBuildAuthenticatorProps } from "@cloudigniter/aws/client";

import type { CiAmplifyOutputs } from "@cloudigniter/aws/types";
import type { CiNextAwsPageConfig } from "@/kernel/types";

import {
  AppLoginPageShell,
  buildAmplifyAuthenticatorCustomProps,
  buildCustomAmplifyAuthenticatorThemeOverride,
} from "@/custom/authenticator";

import outputs from "@/../amplify_outputs.json";

const amplifyOutputs = outputs as CiAmplifyOutputs;

interface AppLoginPageClientWrapperInterface {
  config: CiNextAwsPageConfig;
}

export function AppLoginPageClientWrapper({
  config,
}: AppLoginPageClientWrapperInterface) {
  const authenticatorThemeOverride =
    buildCustomAmplifyAuthenticatorThemeOverride();

  const merge = config.ciConfig.auth.authUi.custom?.merge;

  const theme = useCiNextAwsAuthenticatorTheme(
    authenticatorThemeOverride,
    merge,
  );

  const props = ciBuildAuthenticatorProps(
    buildAmplifyAuthenticatorCustomProps(),
  );

  // const props = ciBuildAuthenticatorProps(amplifyAuthenticatorCustomProps);

  return (
    <CiPage
      name={"login-homepage"}
      setup={{
        showPageHeader: false,
        layoutHasHeader: false,
        layoutHasFooter: false,
        showBreadcrumbs: false,
      }}
      config={config}
      login
    >
      <CiNextAwsLoginPage
        outputs={amplifyOutputs}
        authenticatorProps={props}
        authenticatorStyleTheme={theme}
        authenticatorConfig={config.ciConfig.auth.authUi}
        loginPageShell={AppLoginPageShell}
      />
    </CiPage>
  );
}
