import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import type { CiResponse } from "@cloudigniter/core";

import { ciCreateLambdaHandler } from "./ci-create-lambda-handler";
import { ciInferHandlerName } from "./ci-infer-handler-name";
import type { CiEnvVarName } from "./ci-resolve-required-env";

/**
 * Standard CloudIgniter table-backed service function shape.
 */
export type CiTableServiceFn<TInput> = (args: {
  tableName: string;
  clientConfig: DynamoDBClientConfig;
  input: TInput;
}) => Promise<CiResponse>;

/**
 * Infer the input type from a table-backed service function.
 */
export type CiInferTableServiceInput<TService> = TService extends (args: {
  input: infer TInput;
}) => Promise<CiResponse>
  ? TInput
  : never;

type CiCreateTableServiceHandlerParams<
  TService extends CiTableServiceFn<any>,
  TTableEnvVar extends CiEnvVarName,
> = {
  service: TService;
  tableEnvVar: TTableEnvVar;
  handlerName?: string;
  moduleUrl?: string;
};

/**
 * Create a standardized CloudIgniter table-backed handler.
 */
export function ciCreateTableServiceHandler<
  TService extends CiTableServiceFn<any>,
  TTableEnvVar extends CiEnvVarName,
>({
  service,
  tableEnvVar,
  handlerName,
  moduleUrl,
}: CiCreateTableServiceHandlerParams<TService, TTableEnvVar>) {
  const resolvedHandlerName =
    handlerName ??
    (moduleUrl ? ciInferHandlerName(moduleUrl) : "CI_TABLE_SERVICE_HANDLER");

  return ciCreateLambdaHandler<
    CiInferTableServiceInput<TService>,
    readonly [TTableEnvVar]
  >({
    handlerName: resolvedHandlerName,
    ciEnvVars: [tableEnvVar] as const,

    run: async ({ input, env, clientConfig }) =>
      service({
        tableName: env[tableEnvVar],
        clientConfig,
        input,
      }),
  });
}
