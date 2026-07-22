import type { CiCoreConfig } from "@cloudigniter/core/types";
import type { CiAwsProviderConfig } from "@cloudigniter/aws/types";
import type { CiNextConfig } from "@cloudigniter/next/types";

export type AppCoreConfig = CiCoreConfig & {
  providers?: {
    aws?: CiAwsProviderConfig;
  };
  app?: CiNextConfig;
};
