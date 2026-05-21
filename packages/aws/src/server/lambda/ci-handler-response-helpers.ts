import type { Context } from "aws-lambda";

import type { CiErrorStatus, CiResponse } from "@cloudigniter/core/types";
import { ciResponseError, ciResponseOk } from "@cloudigniter/core/server";
import { ciAttachAwsResponseDebug } from "./ci-attach-aws-response-debug";
import { type CiAppSyncResolverEvent } from "./types";

import type { CiErrorResponse } from "./ci-create-lambda-handler";

/**
 * Bound validation helper injected into handler runtime.
 *
 * This helper already knows:
 * - current handler name
 * - current event / inputString
 */
export type CiBoundValidationErrorFn = (
  message: string,
  statusCode?: CiErrorStatus,
) => Promise<CiResponse>;

/**
 * Create a validation-error helper bound to the current handler name and event.
 */
export function ciCreateBoundValidationError(
  handlerName: string,
  event: CiAppSyncResolverEvent,
): CiBoundValidationErrorFn {
  return (message, statusCode = 400) =>
    ciResponseError(statusCode, `${handlerName}: ${message}`, {
      extras: {
        message,
        parameter: event.arguments.inputString,
      },
    });
}

/**
 * Attach CloudIgniter debug information consistently to a response.
 */
export async function ciAttachHandlerDebug(
  response: Promise<CiResponse> | CiResponse,
  event: CiAppSyncResolverEvent,
  context: Context,
  ciEnvVars: readonly string[],
): Promise<CiResponse> {
  return ciAttachAwsResponseDebug(await response, event, context, [
    ...ciEnvVars,
  ]);
}

/**
 * Standard invalid-request response for malformed or missing CiRequest input.
 */
export function ciReturnInvalidRequest(args: {
  event: CiAppSyncResolverEvent;
  context: Context;
  ciEnvVars: readonly string[];
  handlerName: string;
  inputTypeName: string;
}): Promise<CiResponse> {
  const { event, context, ciEnvVars, handlerName, inputTypeName } = args;

  return ciAttachHandlerDebug(
    ciResponseError(
      400,
      `${handlerName}: inputString must be a valid ${inputTypeName}.`,
      {
        extras: {
          message: `inputString must be a valid ${inputTypeName}.`,
          parameter: event.arguments.inputString,
        },
      },
    ),
    event,
    context,
    ciEnvVars,
  );
}

/**
 * Standard missing-environment-variable response.
 */
export function ciReturnMissingEnv(args: {
  event: CiAppSyncResolverEvent;
  context: Context;
  ciEnvVars: readonly string[];
  handlerName: string;
  envName: string;
}): Promise<CiResponse> {
  const { event, context, ciEnvVars, handlerName, envName } = args;

  return ciAttachHandlerDebug(
    ciResponseError(400, `${handlerName}: ${envName} is not defined.`, {
      extras: {
        message: `${envName} is not defined.`,
        parameter: event.arguments.inputString,
      },
    }),
    event,
    context,
    ciEnvVars,
  );
}

/**
 * Standard service-layer failure response.
 */
export function ciReturnServiceError(args: {
  event: CiAppSyncResolverEvent;
  context: Context;
  ciEnvVars: readonly string[];
  ciResult: CiErrorResponse;
}): Promise<CiResponse> {
  const { event, context, ciEnvVars, ciResult } = args;

  return ciAttachHandlerDebug(
    ciResponseError(ciResult.statusCode, ciResult.body.error, {
      extras: {
        message: ciResult.body.error,
        parameter: event.arguments.inputString,
      },
      details: ciResult.body.details,
    }),
    event,
    context,
    ciEnvVars,
  );
}

/**
 * Standard success response.
 */
export function ciReturnOk(args: {
  event: CiAppSyncResolverEvent;
  context: Context;
  ciEnvVars: readonly string[];
  body: unknown;
}): Promise<CiResponse> {
  const { event, context, ciEnvVars, body } = args;

  return ciAttachHandlerDebug(ciResponseOk(body), event, context, ciEnvVars);
}

/**
 * Standard thrown/unexpected error response.
 */
export function ciReturnThrownError(args: {
  event: CiAppSyncResolverEvent;
  context: Context;
  ciEnvVars: readonly string[];
  handlerName: string;
  message: string;
}): Promise<CiResponse> {
  const { event, context, ciEnvVars, handlerName, message } = args;

  return ciAttachHandlerDebug(
    ciResponseError(400, `${handlerName}: ${message}`, {
      extras: {
        message,
        parameter: event.arguments.inputString,
      },
    }),
    event,
    context,
    ciEnvVars,
  );
}
