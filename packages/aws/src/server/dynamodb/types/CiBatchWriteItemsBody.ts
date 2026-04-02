import type { MetadataBearer } from '@smithy/types';
import { type BatchWriteCommandOutput } from '@aws-sdk/lib-dynamodb';

/**
 * Successful response body for batchWriteItems.
 *
 * Mirrors DynamoDB BatchWriteCommandOutput but normalized into CI Result format.
 */
export type CiBatchWriteItemsBody = {
  /**
   * Items that were not processed by DynamoDB.
   * Caller is responsible for retry logic.
   */
  unprocessedItems?: BatchWriteCommandOutput['UnprocessedItems'];

  /**
   * Capacity consumption details (if requested).
   */
  consumedCapacity?: BatchWriteCommandOutput['ConsumedCapacity'];

  /**
   * Item collection metrics returned by DynamoDB.
   */
  itemCollectionMetrics?: BatchWriteCommandOutput['ItemCollectionMetrics'];

  /**
   * Raw AWS SDK metadata (requestId, httpStatusCode, etc.).
   */
  metadata: MetadataBearer['$metadata'];
};
