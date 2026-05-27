import type { Context } from "aws-lambda";

import type { CiResponseWithMeta } from "@cloudigniter/core/types";
import type { CiAppSyncResolverEvent } from "@ci-aws/types";

/**
 * Attach AWS debug information to a full CloudIgniter response.
 */
export function ciAttachAwsResponseDebug<TResponse extends CiResponseWithMeta>(
  response: TResponse,
  event: CiAppSyncResolverEvent,
  context: Context,
  env: string[],
): TResponse {
  return {
    ...response,
    debug: {
      ...(response.debug ?? {}),
      event,
      context,
      env,
    },
  };
}
