import type {
  CiMainMenuItem,
  CiPageCoreConfig,
} from "@cloudigniter/core/client";
import type {
  CiCoreConfig,
  CiResolvedCoreConfig,
} from "@cloudigniter/core/types";
// import type { CiAmplifyOutputs } from "@cloudigniter/aws";
import type { CiNextResolvedConfig } from "@/config";

export type CiNextPageConfig = CiPageCoreConfig & {
  menu?: CiMainMenuItem[];
  ciConfig: CiCoreConfig & CiResolvedCoreConfig & CiNextResolvedConfig;
};
