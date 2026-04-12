import type { CiResolvedConfig } from "@cloudigniter/core";
import type { CiAwsProviderResolvedConfig } from "./CiAwsProviderResolvedConfig";

/**
 * AWS-extended resolved config.
 */
export type CiAwsResolvedConfig<
  TPlatformConfig = unknown,
  TAppConfig = unknown,
> = CiResolvedConfig<TPlatformConfig, TAppConfig> & {
  providers?: {
    aws?: CiAwsProviderResolvedConfig;
  };
};
