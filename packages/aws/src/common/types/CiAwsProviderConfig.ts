import type { CognitoIdentityProviderClientConfig } from "@aws-sdk/client-cognito-identity-provider";
import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";

export type CiAwsProviderConfig = {
  cognito?: {
    client?: CognitoIdentityProviderClientConfig;
  };
  dynamodb?: {
    clientConfig?: DynamoDBClientConfig;
  };
};
