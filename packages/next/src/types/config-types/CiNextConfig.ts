import type { CiResolvedCoreConfig } from "@cloudigniter/core/types";
import type { CiNextResolvedConfig } from "@cloudigniter/next/types";
import type { CiNextCoreConfig } from "./CiNextCoreConfig";

export type CiNextConfig = {
  appCoreConfig: CiNextCoreConfig; // the cloudigniter.config.ts file
  appResolvedCoreConfig: CiResolvedCoreConfig;
  appNextResolvedConfig: CiNextResolvedConfig;
};
