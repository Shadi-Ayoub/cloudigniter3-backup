import type { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

export interface CiTenantCommonArgs {
  tableName: string;
  clientConfig: DynamoDBClientConfig;
}
