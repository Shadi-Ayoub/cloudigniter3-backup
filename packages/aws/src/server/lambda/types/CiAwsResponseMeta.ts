import type { Context } from "aws-lambda";

import type { CiCoreResponseMeta } from "@cloudigniter/core";
import type { CiAppSyncResolverEvent } from "./CiAppSyncResolverEvent";

/**
 * AWS/Lambda-specific response metadata.
 *
 * Example:
 *
 * import type { CiResponse } from '@cloudigniter/core';
 * import type { CiAwsResponseMeta } from './CiAwsResponseMeta';
 *
 * export type CiAwsResponse<Ok = unknown, Err extends object = CiErrorBody> = CiResponse<
 * Ok,
 * Err,
 * 200,
 * CiErrorStatus,
 * CiAwsResponseMeta
 * >;
 */
export type CiAwsResponseMeta = CiCoreResponseMeta & {
  /**
   * Optional Lambda debug payload.
   */
  debug?: {
    response?: unknown;
    event?: CiAppSyncResolverEvent;
    context?: Context;
    env?: string[];
    metrics?: unknown | null;
    lastEventLog?: unknown | null;
  };
};
