import type { CiPageCoreConfig } from "@cloudigniter/core/types";
import type {
  // CiMainMenuItem,
  CiCoreConfig,
  CiResolvedCoreConfig,
} from "@cloudigniter/core/types";
// import type { CiAmplifyOutputs } from "@cloudigniter/aws";
import type { CiNextResolvedConfig } from "@ci-next/types";

export type CiNextPageConfig = CiPageCoreConfig & {
  coreConfig: CiCoreConfig;
  resolvedCoreConfig: CiResolvedCoreConfig;
  nextResolvedConfig: CiNextResolvedConfig;
};
