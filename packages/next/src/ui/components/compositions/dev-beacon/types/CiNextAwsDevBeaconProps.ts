import type { AbstractIntlMessages } from "next-intl";
import type { ThemeProviderProps } from "next-themes";
import type { CiDevBeaconProps } from "@cloudigniter/core/types";
import type { CiAmplifyOutputs } from "@cloudigniter/aws";

export type CiNexAwsDevBeaconProps = {
  config: CiDevBeaconProps & {
    messages?: AbstractIntlMessages;
    themeProviderProps?: ThemeProviderProps;
    amplifyOutputs?: CiAmplifyOutputs;
  };
};
