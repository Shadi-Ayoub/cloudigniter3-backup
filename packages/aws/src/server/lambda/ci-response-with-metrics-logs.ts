import type {
  CiErrorBody,
  CiErrorStatus,
  CiResponse,
  CiResponseMeta,
} from "@cloudigniter/core/types";

import type { CiAppSyncResolverEvent, CiAwsResponseDebug } from "./types";
import { ciGetLambdaCloudwatchLog } from "./ci-get-lambda-cloudwatch-log";
import { ciGetLambdaMetrics } from "./ci-get-lambda-metrics";

/**
 * Redacts sensitive request headers before echoing event data back to the caller.
 */
function ciRedactHeaders(
  headers?: Record<string, unknown>,
): Record<string, unknown> {
  const redacted: Record<string, unknown> = { ...(headers ?? {}) };

  const ciMaskHeader = (headerName: string) => {
    if (headerName in redacted) {
      redacted[headerName] = "******";
    }
  };

  [
    "authorization",
    "cookie",
    "x-api-key",
    "x-amz-security-token",
    "x-forwarded-for",
  ].forEach(ciMaskHeader);

  return redacted;
}

/**
 * Builds a safe AppSync resolver event copy with sensitive headers redacted.
 */
function ciBuildProtectedEvent(
  event?: CiAppSyncResolverEvent,
): CiAppSyncResolverEvent | undefined {
  if (!event) return undefined;
  if (!event.request) return event;

  return {
    ...event,
    request: {
      ...event.request,
      headers: ciRedactHeaders(
        event.request.headers as Record<string, unknown> | undefined,
      ) as typeof event.request.headers,
    },
  };
}

/**
 * Extract AWS-shaped debug object from generic CiResponseMeta.
 */
function ciGetAwsDebug(meta?: CiResponseMeta): CiAwsResponseDebug | undefined {
  if (!meta?.debug || typeof meta.debug !== "object") {
    return undefined;
  }

  return meta.debug as CiAwsResponseDebug;
}

/**
 * Enriches response with AWS-specific debug data:
 * - redacted AppSync resolver event
 * - Lambda metrics
 * - CloudWatch REPORT log
 *
 * Never throws.
 */
export async function ciResponseWithMetricsAndLogs<Ok>(
  input: CiResponse<Ok, CiErrorBody, 200, CiErrorStatus> & CiResponseMeta,
): Promise<CiResponse<Ok, CiErrorBody, 200, CiErrorStatus> & CiResponseMeta> {
  const awsDebug = ciGetAwsDebug(input);

  const protectedEvent = ciBuildProtectedEvent(awsDebug?.event);
  const functionName = awsDebug?.context?.functionName;

  const [metricsRes, lastLogRes] = await Promise.allSettled([
    functionName
      ? ciGetLambdaMetrics(functionName)
      : Promise.resolve(undefined),
    functionName
      ? ciGetLambdaCloudwatchLog(functionName)
      : Promise.resolve(undefined),
  ]);

  const metrics =
    metricsRes.status === "fulfilled"
      ? metricsRes.value?.ok
        ? metricsRes.value.body
        : null
      : null;

  const lastEventLog =
    lastLogRes.status === "fulfilled"
      ? lastLogRes.value?.ok
        ? lastLogRes.value.body
        : null
      : null;

  return {
    ...input,
    debug: {
      ...(input.debug ?? {}),
      event: protectedEvent,
      context: awsDebug?.context,
      env: awsDebug?.env,
      metrics,
      lastEventLog,
      response: awsDebug?.response,
    },
  };
}
