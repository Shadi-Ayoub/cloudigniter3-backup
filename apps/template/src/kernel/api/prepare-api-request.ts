import type { CiEnvMode, CiRequest } from '@CI/types';

import ciConfig from '@/../cloudigniter.config';

export function prepareApiRequest<T = unknown>(
  request: CiRequest<T>
): CiRequest<T> {
  const cognitoClientConfig = ciConfig.cognito.client;
  const dynamodbClientConfig = ciConfig.dynamodb.clientConfig;

  const envMode = (process.env.NEXT_PUBLIC_CI_ENV_MODE ?? 'test') as CiEnvMode;

  const apiRequest = {
    ...request,
    envMode: request.envMode ?? envMode,
    authMode: request.authMode ?? 'userPool', // <- 'userPool' for signed-in, 'apikey' for guests);
    options: {
      CognitoClientConfig:
        request.options?.CognitoClientConfig ?? cognitoClientConfig,
      DynamoDbClientConfig:
        request.options?.DynamoDbClientConfig ?? dynamodbClientConfig,
    },
    critical: request.critical ?? false,
  };

  return apiRequest;
}
