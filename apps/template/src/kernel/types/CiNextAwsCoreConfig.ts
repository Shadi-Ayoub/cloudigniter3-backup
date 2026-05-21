import type { CiCoreConfig } from "@cloudigniter/core";
import type { CiAwsProviderConfig } from "@cloudigniter/aws";
import type { CiNextConfig } from "@cloudigniter/next";

export type CiNextAwsCoreConfig = CiCoreConfig & {
  providers?: {
    aws?: CiAwsProviderConfig;
  };
  app?: CiNextConfig;
};
