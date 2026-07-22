import type { CiResolvedCoreConfig } from "@cloudigniter/core/types";
import type { CiNextResolvedConfig } from "@cloudigniter/next/types";
import type { AppCoreConfig } from "./AppCoreConfig";

export type AppConfig = {
  appCoreConfig: AppCoreConfig; // the cloudigniter.config.ts file
  appResolvedCoreConfig: CiResolvedCoreConfig;
  appNextResolvedConfig: CiNextResolvedConfig;
};
