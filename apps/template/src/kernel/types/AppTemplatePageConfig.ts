import type { CiNextPageConfig } from "@cloudigniter/next/types";
import type { CiAmplifyOutputs } from "@cloudigniter/aws/types";

export type AppTemplatePageConfig = Omit<CiNextPageConfig, "ciConfig"> & {
  ciConfig: CiNextPageConfig["ciConfig"] & {
    amplifyOutputs: CiAmplifyOutputs;
  };
};
