import type { CiErrorStatus } from "@cloudigniter/core";

/**
 * Map Dynamo/AWS command errors to a CloudIgniter error status.
 */
export function ciMapDynamoErrorStatus(
  error: unknown,
  conditionalNames: readonly string[] = [],
): CiErrorStatus {
  const awsError = error as {
    name?: string;
    $metadata?: {
      httpStatusCode?: number;
    };
  };

  if (awsError?.name && conditionalNames.includes(awsError.name)) {
    return 400;
  }

  const rawStatus = awsError?.$metadata?.httpStatusCode;

  return rawStatus === 400 ||
    rawStatus === 401 ||
    rawStatus === 403 ||
    rawStatus === 404 ||
    rawStatus === 409
    ? rawStatus
    : 500;
}
