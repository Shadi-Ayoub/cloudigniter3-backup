import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";

export interface CiSeederAwsCommonArgs {
  tableName: string;
  clientConfig: DynamoDBClientConfig;
}
