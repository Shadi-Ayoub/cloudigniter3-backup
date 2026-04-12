import type { CiPageConfig } from "@cloudigniter/core";
import type { CiAmplifyOutputs } from "@cloudigniter/aws";
import type { CiNextResolvedConfig } from "../../";
import type { CiMainMenuItem } from "@/ui";

export type CiResolvedPageConfig = CiPageConfig & {
  /**
   * Computed menu already filtered by permissions.
   * The client should render this instead of the raw private settings menu.
   */
  menu?: CiMainMenuItem[];
  ciConfig: CiNextResolvedConfig;
  providers?: {
    aws?: {
      amplifyOutputs?: CiAmplifyOutputs;
    };
  };
};
