"use client";

import {
  CiPage,
  useCiNextAwsAuthenticatorTheme,
} from "@cloudigniter/next/client";
import { CiNextAwsLoginPage } from "@cloudigniter/next/ui/client";
import { ciBuildAuthenticatorProps } from "@cloudigniter/aws/client";
import type { CiAmplifyOutputs } from "@cloudigniter/aws/types";
import type { CiNextAwsPageConfig } from "@/kernel";

// import { getConfig } from '@/kernel';
import {
  amplifyAuthenticatorCustomProps,
  buildCustomAmplifyAuthenticatorThemeOverride,
} from "@/custom/authenticator";
import outputs from "@/../amplify_outputs.json";

const amplifyOutputs = outputs as CiAmplifyOutputs;

interface LoginPageClientWrapperInterface {
  config: CiNextAwsPageConfig;
}

export function LoginPageClientWrapper({
  config,
}: LoginPageClientWrapperInterface) {
  // const { tokens } = useTheme();
  const authenticatorThemeOverride =
    buildCustomAmplifyAuthenticatorThemeOverride();

  // const ciConfig = getConfig();
  const merge = config.ciConfig.authenticator.custom.merge;
  const theme = useCiNextAwsAuthenticatorTheme(
    authenticatorThemeOverride,
    merge,
  );

  const props = ciBuildAuthenticatorProps(amplifyAuthenticatorCustomProps);

  return (
    <CiPage
      name={"dashboard-homepage"}
      setup={{
        showPageHeader: false,
        layoutHasHeader: false,
        layoutHasFooter: false,
      }}
      config={config}
      login={true}
    >
      <CiNextAwsLoginPage
        outputs={amplifyOutputs}
        authenticatorProps={props}
        authenticatorStyleTheme={theme}
        authenticatorConfig={config.ciConfig.authenticator}
      />
    </CiPage>
  );
}
