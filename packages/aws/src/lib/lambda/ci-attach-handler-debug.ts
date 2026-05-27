import type { Context } from "aws-lambda";

import type { CiResponseWithMeta } from "@cloudigniter/core/types";
import { ciAttachAwsResponseDebug } from "./ci-attach-aws-response-debug";
import { type CiAppSyncResolverEvent } from "@ci-aws/types";
/**
 * Attach CloudIgniter debug information consistently to a response.
 */
export async function ciAttachHandlerDebug(
  response: Promise<CiResponseWithMeta> | CiResponseWithMeta,
  event: CiAppSyncResolverEvent,
  context: Context,
  ciEnvVars: readonly string[],
): Promise<CiResponseWithMeta> {
  return ciAttachAwsResponseDebug(await response, event, context, [
    ...ciEnvVars,
  ]);
}
