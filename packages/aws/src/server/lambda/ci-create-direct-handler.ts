import type { CiResponse } from "@cloudigniter/core/types";

import { ciCreateLambdaHandler } from "./ci-create-lambda-handler";
import { ciInferHandlerName } from "./ci-infer-handler-name";

import type {
  CiCreateDirectHandlerParams,
  CiDirectServiceFn,
  CiInferDirectServiceInput,
} from "./types";

/**
 * Create a standardized CloudIgniter direct-input handler.
 */
export function ciCreateDirectHandler<TService extends CiDirectServiceFn<any>>({
  service,
  handlerName,
  moduleUrl,
}: CiCreateDirectHandlerParams<TService>) {
  const resolvedHandlerName =
    handlerName ??
    (moduleUrl ? ciInferHandlerName(moduleUrl) : "CI_DIRECT_HANDLER");

  return ciCreateLambdaHandler<CiInferDirectServiceInput<TService>>({
    handlerName: resolvedHandlerName,
    requestMode: "direct-input",

    run: async ({ input }) => service(input),
  });
}
