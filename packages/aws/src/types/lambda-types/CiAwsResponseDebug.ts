import type { Context } from "aws-lambda";
import type { CiAppSyncResolverEvent } from "./CiAppSyncResolverEvent";

/**
 * Minimal AWS debug shape expected by this helper.
 */
export type CiAwsResponseDebug = {
  event?: CiAppSyncResolverEvent;
  context?: Context;
  env?: string[];
  metrics?: unknown | null;
  lastEventLog?: unknown | null;
  response?: unknown;
};
