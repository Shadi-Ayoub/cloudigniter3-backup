import type { CiSystemStatusCheckList } from "@cloudigniter/next";
import type { CiAmplifyOutputs } from "@cloudigniter/aws";

export type CiTemplateSystemStatusCheckList = CiSystemStatusCheckList & {
  amplifyOutputs: CiAmplifyOutputs | null;
};
