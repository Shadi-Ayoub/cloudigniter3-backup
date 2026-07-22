import type { CiCoreConfig } from "@cloudigniter/core/types";
import type { CiAwsProviderConfig } from "@cloudigniter/aws/types";
import type { CiNextAppConfig } from "./CiNextAppConfig";

export type CiNextCoreConfig = CiCoreConfig & {
  providers?: {
    aws?: CiAwsProviderConfig;
  };
  app?: CiNextAppConfig;
};
