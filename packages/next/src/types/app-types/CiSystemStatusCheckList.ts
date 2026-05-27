import type { CiSettings } from "@cloudigniter/core/types";
// import type { CiSettings, CiSystemStatus } from "@cloudigniter/core";
// import type { CiAmplifyOutputs } from "@cloudigniter/aws";

export type CiSystemStatusCheckList = {
  // amplifyOutputs: CiAmplifyOutputs | undefined;
  settings?: CiSettings;
  // status?: CiSystemStatus;
};
