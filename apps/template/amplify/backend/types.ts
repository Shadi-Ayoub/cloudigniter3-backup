import { defineBackend } from "@aws-amplify/backend";

// import { ENV } from '@cloudigniter/next/server/backend';
import { ciLoadMergedBackendResources } from "./plugins/ci-loader";

export const backendShape = ciLoadMergedBackendResources();
export type CiBackend = ReturnType<typeof defineBackend<typeof backendShape>>;
export type {
  CiEnvKey,
  CiEnvAllowList,
} from "@cloudigniter/aws/server/backend";

// export type EnvKey = (typeof ENV)[keyof typeof ENV];
// export type EnvAllowList = readonly EnvKey[];
