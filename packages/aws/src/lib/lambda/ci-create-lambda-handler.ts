import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import type { Context } from "aws-lambda";

import type { CiResponse, CiRequest } from "@cloudigniter/core/types";
import {
  ciNormalizeThrownError,
  ciSafeParseRequest,
} from "@cloudigniter/core/lib";
import type {
  CiAppSyncResolverEvent,
  CiErrorResponse,
  CiLambdaHandlerRequestMode,
} from "@ci-aws/types";

import {
  ciResolveRequiredEnv,
  type CiCoreHandlerEnv,
  type CiEnvVarName,
  type CiResolvedEnv,
} from "./ci-resolve-required-env";
import {
  ciAttachHandlerDebug,
  ciCreateBoundValidationError,
  ciReturnInvalidRequest,
  ciReturnMissingEnv,
  ciReturnOk,
  ciReturnServiceError,
  ciReturnThrownError,
  type CiBoundValidationErrorFn,
} from "./ci-handler-response-helpers";

/**
 * Core environment variables required by all standardized CloudIgniter handlers.
 */
export const CI_CORE_HANDLER_ENV_VARS = ["CI_REGION", "CI_ENV_MODE"] as const;

/**
 * Tuple type representing the complete env var list used by the handler:
 * core env vars + handler-specific extra env vars.
 */
export type CiHandlerEnvVars<TExtraEnvVars extends readonly CiEnvVarName[]> =
  readonly [...typeof CI_CORE_HANDLER_ENV_VARS, ...TExtraEnvVars];

/**
 * Fully resolved env object exposed to handler callbacks.
 */
export type CiHandlerResolvedEnv<
  TExtraEnvVars extends readonly CiEnvVarName[],
> = CiCoreHandlerEnv & CiResolvedEnv<TExtraEnvVars>;

/**
 * Runtime object passed into transform / validate / run callbacks.
 */
export type CiLambdaHandlerRuntime<
  TInput,
  TExtraEnvVars extends readonly CiEnvVarName[],
> = {
  ciRequest: CiRequest<TInput>;
  input: TInput;
  env: CiHandlerResolvedEnv<TExtraEnvVars>;
  event: CiAppSyncResolverEvent;
  context: Context;
  clientConfig: DynamoDBClientConfig;
  region: string;
  ciEnvVars: CiHandlerEnvVars<TExtraEnvVars>;
  ciValidationError: CiBoundValidationErrorFn;
};

/**
 * Optional pre-validation input transformation step.
 *
 * At transform stage, `clientConfig` is not built yet, so it is intentionally
 * exposed as `undefined`.
 */
export type CiLambdaHandlerTransformInputFn<
  TInput,
  TTransformedInput,
  TExtraEnvVars extends readonly CiEnvVarName[],
> = (
  runtime: Omit<
    CiLambdaHandlerRuntime<TInput, TExtraEnvVars>,
    "input" | "clientConfig"
  > & {
    input: TInput;
    clientConfig: undefined;
  },
) => Promise<TTransformedInput> | TTransformedInput;

/**
 * Optional validation hook.
 */
export type CiLambdaHandlerValidateFn<
  TInput,
  TExtraEnvVars extends readonly CiEnvVarName[],
> = (
  runtime: CiLambdaHandlerRuntime<TInput, TExtraEnvVars>,
) => Promise<void | CiResponse> | void | CiResponse;

/**
 * Optional client config builder.
 */
export type CiLambdaHandlerBuildClientConfigFn<
  TInput,
  TExtraEnvVars extends readonly CiEnvVarName[],
> = (args: {
  ciRequest: CiRequest<TInput>;
  env: CiHandlerResolvedEnv<TExtraEnvVars>;
  region: string;
  event: CiAppSyncResolverEvent;
  context: Context;
}) => DynamoDBClientConfig;

/**
 * Required business logic callback.
 */
export type CiLambdaHandlerRunFn<
  TInput,
  TExtraEnvVars extends readonly CiEnvVarName[],
> = (
  runtime: CiLambdaHandlerRuntime<TInput, TExtraEnvVars>,
) => Promise<CiResponse>;

/**
 * Shared configuration used to create a standardized CloudIgniter Lambda/AppSync handler.
 */
export type CiCreateLambdaHandlerParams<
  TInput,
  TExtraEnvVars extends readonly CiEnvVarName[] = readonly [],
  TFinalInput = TInput,
> = {
  handlerName: string;
  inputTypeName?: string;
  ciEnvVars?: TExtraEnvVars;
  requestMode?: CiLambdaHandlerRequestMode;
  transformInput?: CiLambdaHandlerTransformInputFn<
    TInput,
    TFinalInput,
    TExtraEnvVars
  >;
  validate?: CiLambdaHandlerValidateFn<TFinalInput, TExtraEnvVars>;
  buildClientConfig?: CiLambdaHandlerBuildClientConfigFn<
    TFinalInput,
    TExtraEnvVars
  >;
  run: CiLambdaHandlerRunFn<TFinalInput, TExtraEnvVars>;
};

/**
 * Internal parsed-request result used by the wrapper before runtime creation.
 */
type CiParsedHandlerInput<TInput> = {
  ciRequest: CiRequest<TInput>;
  input: TInput;
};

/**
 * Parse the incoming handler input according to the configured request mode.
 */
function ciParseHandlerInput<TInput>(args: {
  inputString: string | null | undefined;
  requestMode: CiLambdaHandlerRequestMode;
}): CiParsedHandlerInput<TInput> | undefined {
  const { inputString, requestMode } = args;

  if (!inputString || typeof inputString !== "string") {
    return undefined;
  }

  if (requestMode === "ci-request") {
    const ciRequest = ciSafeParseRequest<TInput>(inputString) as
      | CiRequest<TInput>
      | undefined;

    if (!ciRequest?.input) {
      return undefined;
    }

    return {
      ciRequest,
      input: ciRequest.input,
    };
  }

  try {
    const input = JSON.parse(inputString) as TInput;

    return {
      ciRequest: {
        input,
      } as CiRequest<TInput>,
      input,
    };
  } catch {
    return undefined;
  }
}

/**
 * Create a standardized CloudIgniter Lambda/AppSync handler.
 */
export function ciCreateLambdaHandler<
  TInput,
  TExtraEnvVars extends readonly CiEnvVarName[] = readonly [],
  TFinalInput = TInput,
>({
  handlerName,
  inputTypeName = "CiRequest",
  ciEnvVars = [] as unknown as TExtraEnvVars,
  requestMode = "ci-request",
  transformInput,
  validate,
  buildClientConfig,
  run,
}: CiCreateLambdaHandlerParams<TInput, TExtraEnvVars, TFinalInput>) {
  const fullCiEnvVars = [
    ...CI_CORE_HANDLER_ENV_VARS,
    ...ciEnvVars,
  ] as CiHandlerEnvVars<TExtraEnvVars>;

  return async function ciLambdaHandler(
    event: CiAppSyncResolverEvent,
    context: Context,
  ): Promise<CiResponse> {
    try {
      const parsed = ciParseHandlerInput<TInput>({
        inputString: event.arguments.inputString,
        requestMode,
      });

      if (!parsed) {
        return ciReturnInvalidRequest({
          event,
          context,
          ciEnvVars: fullCiEnvVars,
          handlerName,
          inputTypeName,
        });
      }

      const { ciRequest, input } = parsed;

      const envResolution = ciResolveRequiredEnv(fullCiEnvVars);

      if (!envResolution.ok) {
        return ciReturnMissingEnv({
          event,
          context,
          ciEnvVars: fullCiEnvVars,
          handlerName,
          envName: envResolution.missingEnvVar,
        });
      }

      const env = envResolution.env as CiHandlerResolvedEnv<TExtraEnvVars>;
      const region = env.CI_REGION;
      const ciValidationError = ciCreateBoundValidationError(
        handlerName,
        event,
      );

      const finalInput = transformInput
        ? await transformInput({
            ciRequest,
            input,
            env,
            event,
            context,
            clientConfig: undefined,
            region,
            ciEnvVars: fullCiEnvVars,
            ciValidationError,
          })
        : (input as unknown as TFinalInput);

      const clientConfig: DynamoDBClientConfig = buildClientConfig?.({
        ciRequest: ciRequest as unknown as CiRequest<TFinalInput>,
        env,
        region,
        event,
        context,
      }) ??
        ciRequest.options?.DynamoDbClientConfig ?? { region };

      const runtime: CiLambdaHandlerRuntime<TFinalInput, TExtraEnvVars> = {
        ciRequest: ciRequest as unknown as CiRequest<TFinalInput>,
        input: finalInput,
        env,
        event,
        context,
        clientConfig,
        region,
        ciEnvVars: fullCiEnvVars,
        ciValidationError,
      };

      if (validate) {
        const validationResult = await validate(runtime);

        if (validationResult) {
          return ciAttachHandlerDebug(
            validationResult,
            event,
            context,
            fullCiEnvVars,
          );
        }
      }

      const ciResult = await run(runtime);

      if (!ciResult.ok) {
        return ciReturnServiceError({
          event,
          context,
          ciEnvVars: fullCiEnvVars,
          ciResult: ciResult as CiErrorResponse,
        });
      }

      return ciReturnOk({
        event,
        context,
        ciEnvVars: fullCiEnvVars,
        body: ciResult.body,
      });
    } catch (error) {
      const ciError = ciNormalizeThrownError(error);

      return ciReturnThrownError({
        event,
        context,
        ciEnvVars: fullCiEnvVars,
        handlerName,
        message: ciError.message,
      });
    }
  };
}
