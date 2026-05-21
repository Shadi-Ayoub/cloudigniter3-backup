import type { CiNextPageConfig } from "@cloudigniter/next";
import type { CiAwsProviderResolvedConfig } from "@cloudigniter/aws";
// import type { CiNextResolvedConfig } from "../../config";

export type CiNextAwsPageConfig = CiNextPageConfig &
  CiAwsProviderResolvedConfig;
