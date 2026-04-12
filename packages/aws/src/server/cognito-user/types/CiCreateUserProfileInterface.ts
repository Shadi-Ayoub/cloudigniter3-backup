import type { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

export type CiCreateUserProfileInterface = {
  tableName: string;
  userId: string;
  profile: string;
  DynamoDbClientConfig: DynamoDBClientConfig;
};
