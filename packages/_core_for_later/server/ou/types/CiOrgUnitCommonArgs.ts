// import type { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

// export interface CiOrgUnitCommonArgs {
//   tableName: string;
//   clientConfig: DynamoDBClientConfig;
// }

export interface CiOrgUnitCommonArgs<TClientConfig = unknown> {
  tableName: string;
  clientConfig: TClientConfig;
}
