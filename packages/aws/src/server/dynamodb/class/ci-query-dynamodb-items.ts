import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import type {
  DynamoDBDocumentClient,
  QueryCommandInput,
  QueryCommandOutput,
} from "@aws-sdk/lib-dynamodb";

import {
  ciSerializeUnknownError,
  type CiErrorStatus,
  type CiResult,
} from "@cloudigniter/core";
import { ciNormalizeThrownError } from "@cloudigniter/core/server";

/**
 * Success body returned by `queryItemsFn`.
 */
export type QueryItemsBody<T> = {
  items: T[];
  count?: number;
  scannedCount?: number;
  lastEvaluatedKey?: Record<string, any>;
  consumedCapacity?: QueryCommandOutput["ConsumedCapacity"];
  metadata: QueryCommandOutput["$metadata"];
};

/**
 * Result returned by `queryItemsFn`.
 */
export type QueryItemsResult<T = Record<string, any>> = CiResult<
  QueryItemsBody<T>
>;

/**
 * Low-level DynamoDB query helper.
 *
 * Responsibilities:
 * - Execute QueryCommand
 * - Normalize success and error responses into `CiResult`
 * - Never throw
 *
 * Design notes:
 * - Thin wrapper only
 * - Passes QueryCommandInput through as-is
 * - Does not auto-paginate
 */
export async function queryItems<T = Record<string, any>>(
  doc: DynamoDBDocumentClient,
  input: QueryCommandInput,
): Promise<QueryItemsResult<T>> {
  try {
    const res: QueryCommandOutput = await doc.send(new QueryCommand(input));

    return {
      ok: true,
      statusCode: 200,
      body: {
        items: (res.Items ?? []) as T[],
        count: res.Count,
        scannedCount: res.ScannedCount,
        lastEvaluatedKey: res.LastEvaluatedKey as
          | Record<string, any>
          | undefined,
        consumedCapacity: res.ConsumedCapacity,
        metadata: res.$metadata,
      },
    };
  } catch (error) {
    const ciError = ciNormalizeThrownError(error);

    /**
     * Since `ciNormalizeThrownError(...)` does not expose a directly usable
     * typed `statusCode` for this helper, we derive a safe CloudIgniter status.
     */
    const rawStatus =
      typeof (error as { $metadata?: { httpStatusCode?: unknown } })?.$metadata
        ?.httpStatusCode === "number"
        ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata
            ?.httpStatusCode
        : undefined;

    const statusCode: CiErrorStatus =
      rawStatus === 400 ||
      rawStatus === 401 ||
      rawStatus === 403 ||
      rawStatus === 404 ||
      rawStatus === 409
        ? rawStatus
        : 500;

    return {
      ok: false,
      statusCode,
      body: {
        error: ciError.message || "Failed to query DynamoDB items.",
        details: ciSerializeUnknownError(error),
      },
    };
  }
}
