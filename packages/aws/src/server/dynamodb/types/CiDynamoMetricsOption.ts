/**
 * Shared metrics option used by DynamoDB helpers.
 *
 * - `false | undefined` => no capacity / collection metrics
 * - `true`              => sensible defaults
 * - object              => explicit control
 */
export type CiDynamoMetricsOption =
  | boolean
  | {
      returnConsumedCapacity?: "NONE" | "TOTAL" | "INDEXES";
      returnItemCollectionMetrics?: "NONE" | "SIZE";
    };
