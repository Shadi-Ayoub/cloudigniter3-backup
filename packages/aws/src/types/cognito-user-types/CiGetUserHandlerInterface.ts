import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import type { CiGetCognitoUserInterface } from "./CiGetCognitoUserInterface";

export type CiGetUserHandlerInterface = CiGetCognitoUserInterface & {
  DynamoDbClientConfig?: DynamoDBClientConfig;
};
