import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";

/**
 * Input used to create a settings service from runtime environment values.
 */
export type CiCreateSettingsServiceFromEnvInput = {
  /**
   * Raw environment object, usually `process.env`.
   */
  env: Record<string, string | undefined>;

  /**
   * Optional AWS SDK DynamoDB client configuration.
   *
   * This type remains in the AWS package layer and should not be exposed from
   * framework-agnostic packages.
   */
  clientConfig?: DynamoDBClientConfig;
};
