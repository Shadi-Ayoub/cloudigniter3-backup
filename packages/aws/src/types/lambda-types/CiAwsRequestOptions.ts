import type { CognitoIdentityProviderClientConfig } from "@aws-sdk/client-cognito-identity-provider";
import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";

/**
 * AWS-specific request options used by CloudIgniter AWS clients.
 */
export type CiAwsRequestOptions = {
  cognitoClientConfig?: CognitoIdentityProviderClientConfig;
  dynamoDbClientConfig?: DynamoDBClientConfig;
  [key: string]: unknown;
};
