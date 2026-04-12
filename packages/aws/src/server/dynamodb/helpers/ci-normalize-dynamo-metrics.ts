import type { CiDynamoMetricsOption } from "../types/CiDynamoMetricsOption";

/**
 * Normalize shared metrics options into concrete DynamoDB command values.
 */
export function ciNormalizeDynamoMetrics(metrics?: CiDynamoMetricsOption): {
  returnConsumedCapacity: "NONE" | "TOTAL" | "INDEXES";
  returnItemCollectionMetrics: "NONE" | "SIZE";
} {
  if (!metrics) {
    return {
      returnConsumedCapacity: "NONE",
      returnItemCollectionMetrics: "NONE",
    };
  }

  if (metrics === true) {
    return {
      returnConsumedCapacity: "TOTAL",
      returnItemCollectionMetrics: "SIZE",
    };
  }

  return {
    returnConsumedCapacity: metrics.returnConsumedCapacity ?? "NONE",
    returnItemCollectionMetrics: metrics.returnItemCollectionMetrics ?? "NONE",
  };
}
