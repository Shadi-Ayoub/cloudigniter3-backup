import type { Context } from "aws-lambda";
import type { CiAppSyncResolverEvent } from "./CiAppSyncResolverEvent";

export type CiAttachAwsResponseDebugInput = {
  response?: unknown;
  event?: CiAppSyncResolverEvent;
  context?: Context;
  env?: string[];
  metrics?: unknown | null;
  lastEventLog?: unknown | null;
};
