/**
 * Minimal client config accepted by the CloudIgniter Dynamodb abstraction.
 *
 * Replace this with your real shared type if already defined elsewhere.
 */
export type CiDynamoDbClientConfig = {
  region?: string;
  credentials?: unknown;
};

/**
 * Input used to create a settings service from runtime environment values.
 */
export type CiCreateSettingsServiceFromEnvInput = {
  /**
   * CloudIgniter DynamoDB client configuration.
   */
  clientConfig?: CiDynamoDbClientConfig;

  /**
   * Raw environment object, usually `process.env`.
   */
  env: Record<string, string | undefined>;
};
