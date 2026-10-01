import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { CiSettingsRegistry, CiSettingsScope } from "@cloudigniter/core/types";

export type CiAwsSettingsStoreOptions = {
  client: DynamoDBDocumentClient;
  tables: Record<CiSettingsScope, string>;
};
export type CiAwsSettingsHandlerOptions = {
  registry: CiSettingsRegistry;
  client?: DynamoDBDocumentClient;
};
