import type { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

export interface CiSeederCommonArgs {
  tableName: string;
  clientConfig: DynamoDBClientConfig;
}
