import "server-only";
import type { CiRequest } from "@cloudigniter/core/types";
import { ciGetEnvMode } from "@cloudigniter/next/lib";

import ciConfig from "@/../cloudigniter.config";

export function appPrepareServerApiRequest<T = unknown>(
  request: CiRequest<T>,
): CiRequest<T> {
  const cognitoClientConfig = ciConfig.providers.aws.cognito.client;
  const dynamodbClientConfig = ciConfig.providers.aws.dynamodb.clientConfig;

  const envMode = ciGetEnvMode();

  return {
    ...request,
    envMode: request.envMode ?? envMode,
    authMode: request.authMode ?? "userPool",
    options: {
      CognitoClientConfig:
        request.options?.CognitoClientConfig ?? cognitoClientConfig,
      DynamoDbClientConfig:
        request.options?.DynamoDbClientConfig ?? dynamodbClientConfig,
    },
    critical: request.critical ?? false,
  };
}
