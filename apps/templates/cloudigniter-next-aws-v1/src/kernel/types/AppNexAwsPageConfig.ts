import type { CiNextPageConfig } from "@cloudigniter/next/types";
import type { CiAwsProviderResolvedConfig } from "@cloudigniter/aws/types";
// import type { CiNextResolvedConfig } from "../../config";

export type AppNextAwsPageConfig = CiNextPageConfig &
  CiAwsProviderResolvedConfig;
