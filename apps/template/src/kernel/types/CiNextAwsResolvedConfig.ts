import type { CiResolvedCoreConfig } from "@cloudigniter/core";
import type { CiAwsProviderResolvedConfig } from "@cloudigniter/aws";
import type { CiNextResolvedConfig } from "@cloudigniter/next";

export type CiNextAwsResolvedConfig = CiResolvedCoreConfig &
  CiNextResolvedConfig &
  CiAwsProviderResolvedConfig;
