"use client";

import {
  CiPage,
  useCiNextAwsAuthenticatorTheme,
} from "@cloudigniter/next/client";
import { CiNextAwsLoginPage } from "@cloudigniter/next/ui/client";
import { ciBuildAuthenticatorProps } from "@cloudigniter/aws/client";
import type { CiAmplifyOutputs } from "@cloudigniter/aws/types";
import type { CiNextAwsPageConfig } from "@/kernel/types";

// import { getConfig } from '@/kernel';
import {
  amplifyAuthenticatorCustomProps,
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
  // const { tokens } = useTheme();
  const authenticatorThemeOverride =
    buildCustomAmplifyAuthenticatorThemeOverride();

  // const ciConfig = getConfig();
  const merge = config.ciConfig.auth.authUi.custom?.merge;
  const theme = useCiNextAwsAuthenticatorTheme(
    authenticatorThemeOverride,
    merge,
  );

  const props = ciBuildAuthenticatorProps(amplifyAuthenticatorCustomProps);
  // throw new Error(`Authenticator props: ${JSON.stringify(props)}`);
  return (
    <CiPage
      name={"login-homepage"}
      setup={{
        showPageHeader: false,
        layoutHasHeader: false,
        layoutHasFooter: false,
        // showBreadcrumbs: false,
      }}
      config={config}
      login
    >
      <CiNextAwsLoginPage
        outputs={amplifyOutputs}
        authenticatorProps={props}
        authenticatorStyleTheme={theme}
        authenticatorConfig={config.ciConfig.auth.authUi}
      />
    </CiPage>
  );
}
