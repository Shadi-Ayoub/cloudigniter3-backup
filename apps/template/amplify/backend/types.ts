import { defineBackend } from "@aws-amplify/backend";
import { ciMergeAmplifyBackendResources } from "@cloudigniter/aws/server/backend";

import { customBackendResources } from "../custom/backend";
import { coreResources } from "./backend-core";

export const backendShape = ciMergeAmplifyBackendResources(
  coreResources,
  customBackendResources,
);
export type CiBackend = ReturnType<typeof defineBackend<typeof backendShape>>;
