import type { CiResolvedPageConfig } from "@cloudigniter/next";
import type { CiAmplifyOutputs } from "@cloudigniter/aws";

export type CiTemplatePageConfig = Omit<CiResolvedPageConfig, "ciConfig"> & {
  ciConfig: CiResolvedPageConfig["ciConfig"] & {
    amplifyOutputs: CiAmplifyOutputs;
  };
};
