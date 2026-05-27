import {
  BatchWriteCommand,
  type BatchWriteCommandInput,
  type DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { ciSerializeUnknownError } from "@cloudigniter/core/lib";
import type { CiBatchWriteItemsResult } from "@ci-aws/types";

/**
 * Executes a single DynamoDB BatchWriteCommand.
 *
 * This is a **low-level wrapper** that:
 * - Converts AWS SDK responses into CloudIgniter `CiResult`
 * - Normalizes error handling
 * - Does NOT perform retries
 *
 * @param doc - Initialized DynamoDBDocumentClient
 * @param input - BatchWriteCommandInput (must include RequestItems)
 *
 * @returns CiResult:
 * - ok: true → contains DynamoDB response data
 * - ok: false → normalized error response
 *
 * @remarks
 * - This function intentionally does NOT retry unprocessed items.
 * - Higher-level services (e.g., clearSeeder) should implement retry strategies.
 * - Keeps AWS SDK concerns isolated from service layer.
 *
 * @example
 * const res = await batchWriteItems(doc, {
 *   RequestItems: {
 *     MyTable: [{ DeleteRequest: { Key: { PK: 'A', SK: '1' } } }]
 *   }
 * });
 *
 * if (!res.ok) return res;
 */
export async function batchWriteItems(
  doc: DynamoDBDocumentClient,
  input: BatchWriteCommandInput,
): Promise<CiBatchWriteItemsResult> {
  try {
    const res = await doc.send(new BatchWriteCommand(input));

    return {
      ok: true,
      statusCode: 200,
      body: {
        unprocessedItems: res.UnprocessedItems,
        consumedCapacity: res.ConsumedCapacity,
        itemCollectionMetrics: res.ItemCollectionMetrics,
        metadata: res.$metadata,
      },
    };
  } catch (error: any) {
    const statusCode =
      error?.$metadata?.httpStatusCode === 400 ||
      error?.$metadata?.httpStatusCode === 401 ||
      error?.$metadata?.httpStatusCode === 403 ||
      error?.$metadata?.httpStatusCode === 404 ||
      error?.$metadata?.httpStatusCode === 409
        ? error.$metadata.httpStatusCode
        : 500;

    return {
      ok: false,
      statusCode,
      body: {
        error: error?.message ?? String(error),
        details: ciSerializeUnknownError(error),
      },
    };
  }
}
