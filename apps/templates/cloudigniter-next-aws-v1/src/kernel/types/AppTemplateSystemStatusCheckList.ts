import type { CiSystemStatusCheckList } from "@cloudigniter/next/types";
import type { CiAmplifyOutputs } from "@cloudigniter/aws/types";

export type AppTemplateSystemStatusCheckList = CiSystemStatusCheckList & {
  amplifyOutputs: CiAmplifyOutputs | null;
};
