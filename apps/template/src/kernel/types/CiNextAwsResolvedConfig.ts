import type { CiResolvedCoreConfig } from "@cloudigniter/core/types";
import type { CiAwsProviderResolvedConfig } from "@cloudigniter/aws/types";
import type { CiNextResolvedConfig } from "@cloudigniter/next/types";

export type CiNextAwsResolvedConfig = CiResolvedCoreConfig &
  CiNextResolvedConfig &
  CiAwsProviderResolvedConfig;
