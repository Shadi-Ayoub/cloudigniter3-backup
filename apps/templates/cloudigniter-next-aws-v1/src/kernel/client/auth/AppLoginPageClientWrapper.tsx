"use client";

import {
  CiPage,
  useCiNextAwsAuthenticatorTheme,
} from "@cloudigniter/next/client";
import { CiNextAwsLoginPage } from "@cloudigniter/next/ui/client";
import type { CiNextContext } from "@cloudigniter/next/types";
import { ciBuildAuthenticatorProps } from "@cloudigniter/aws/client";
import type { CiAuthenticatorPageMode } from "@cloudigniter/core/types";

import type { CiAmplifyOutputs } from "@cloudigniter/aws/types";

import {
  AppLoginPageShell,
  buildAmplifyAuthenticatorCustomProps,
  buildCustomAmplifyAuthenticatorThemeOverride,
} from "@/custom/authenticator";

import outputs from "@/../amplify_outputs.json";

const amplifyOutputs = outputs as CiAmplifyOutputs;

interface AppLoginPageClientWrapperInterface {
  context: CiNextContext;
  mode?: CiAuthenticatorPageMode;
}

export function AppLoginPageClientWrapper({
  context,
  mode = "signIn",
}: AppLoginPageClientWrapperInterface) {
  const authenticatorThemeOverride =
    buildCustomAmplifyAuthenticatorThemeOverride();

  const merge = context.config.appCoreConfig.auth.authUi.custom?.merge;

  const theme = useCiNextAwsAuthenticatorTheme(
    authenticatorThemeOverride,
    merge,
  );

  const props = ciBuildAuthenticatorProps(
    buildAmplifyAuthenticatorCustomProps({ mode }),
  );

  return (
    <CiPage
      name={mode === "signUp" ? "create-account-page" : "login-homepage"}
      setup={{
        showPageHeader: false,
        layoutHasHeader: false,
        layoutHasFooter: false,
        showBreadcrumbs: false,
      }}
      context={context}
      login
    >
      <CiNextAwsLoginPage
        outputs={amplifyOutputs}
        authenticatorProps={props}
        authenticatorStyleTheme={theme}
        authenticatorConfig={context.config.appCoreConfig.auth.authUi}
        loginPageShell={AppLoginPageShell}
      />
    </CiPage>
  );
}
