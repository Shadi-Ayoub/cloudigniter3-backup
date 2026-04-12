import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import type { CiCreateCognitoUserInterface } from "./CiCreateCognitoUserInterface";

export type CiCreateUserHandlerInterface = CiCreateCognitoUserInterface & {
  profile: string;
  DynamoDbClientConfig?: DynamoDBClientConfig;
};
