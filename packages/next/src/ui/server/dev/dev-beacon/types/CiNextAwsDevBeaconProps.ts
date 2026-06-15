import type { AbstractIntlMessages } from "next-intl";
import type { ThemeProviderProps } from "next-themes";
import type { CiDevBeaconProps } from "@cloudigniter/core/types";
import type { CiAmplifyOutputs } from "@cloudigniter/aws/types";
import type { CiNextPageConfig } from "@ci-next/types";

export type CiNexAwsDevBeaconProps = {
  config: CiDevBeaconProps<CiNextPageConfig> & {
    messages?: AbstractIntlMessages;
    themeProviderProps?: ThemeProviderProps;
    amplifyOutputs?: CiAmplifyOutputs;
  };
};
