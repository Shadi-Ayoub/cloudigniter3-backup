import type { MetadataBearer } from "@smithy/types";
import type { ConsumedCapacity } from "@aws-sdk/client-dynamodb";

/**
 * Success body for transaction writes.
 */
export type CiTransactWriteBody = {
  consumedCapacity?: ConsumedCapacity[];
  metadata: MetadataBearer["$metadata"];
  warnings?: string[];
};
