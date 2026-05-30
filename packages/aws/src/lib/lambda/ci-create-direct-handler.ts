import type { Context } from "aws-lambda";
import { ciCreateLambdaHandler } from "./ci-create-lambda-handler";
import { ciInferHandlerName } from "./ci-infer-handler-name";

import type { CiResponse } from "@cloudigniter/core/types";

import type {
  CiAppSyncResolverEvent,
  CiCreateDirectHandlerParams,
  CiDirectServiceFn,
  CiInferDirectServiceInput,
} from "@ci-aws/types";

/**
 * CloudIgniter direct-input Lambda handler.
 */
export type CiDirectHandler = (
  event: CiAppSyncResolverEvent,
  context: Context,
) => Promise<CiResponse>;

/**
 * Create a standardized CloudIgniter direct-input handler.
 */
export function ciCreateDirectHandler<TService extends CiDirectServiceFn<any>>({
  service,
  handlerName,
  moduleUrl,
}: CiCreateDirectHandlerParams<TService>): CiDirectHandler {
  const resolvedHandlerName =
    handlerName ??
    (moduleUrl ? ciInferHandlerName(moduleUrl) : "CI_DIRECT_HANDLER");

  return ciCreateLambdaHandler<CiInferDirectServiceInput<TService>>({
    handlerName: resolvedHandlerName,
    requestMode: "direct-input",

    run: async ({ input }) => service(input),
  });
}
