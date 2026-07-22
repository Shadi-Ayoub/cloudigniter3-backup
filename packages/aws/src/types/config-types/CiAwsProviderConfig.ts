import type { CognitoIdentityProviderClientConfig } from "@aws-sdk/client-cognito-identity-provider";
import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import type { CiAmplifyOutputs } from "@ci-aws/types";

export type CiAwsProviderConfig = {
  amplify?: {
    amplifyOutputs: CiAmplifyOutputs;
  };
  cognito?: {
    client?: CognitoIdentityProviderClientConfig;
  };
  dynamodb?: {
    clientConfig?: DynamoDBClientConfig;
  };
};
