import type { CiAmplifyOutputs } from "@cloudigniter/aws";
import type { CiNextResolvedConfig } from "@cloudigniter/next";

export type CiNextAwsResolvedConfig<
  TPlatformConfig = unknown,
  TAppConfig = unknown,
> = CiNextResolvedConfig<TPlatformConfig, TAppConfig> & {
  amplifyOutputs: CiAmplifyOutputs;
};
