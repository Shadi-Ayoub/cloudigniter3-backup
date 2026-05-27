import type { MetadataBearer } from "@smithy/types";
import type {
  ConsumedCapacity,
  ItemCollectionMetrics,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  type DeleteCommandInput,
} from "@aws-sdk/lib-dynamodb";

import { ciSerializeUnknownError } from "@cloudigniter/core/lib";
import type { CiResult } from "@cloudigniter/core/types";
import type {
  CiDynamoDeleteReturnValues,
  CiDynamoExistenceMode,
  CiDynamoMetricsOption,
} from "@ci-aws/types";
import { ciBuildDynamoExistenceCondition } from "../helpers/ci-build-dynamo-existence-condition";
import { ciMapDynamoErrorStatus } from "../helpers/ci-map-dynamo-error-status";
import { ciNormalizeDynamoMetrics } from "../helpers/ci-normalize-dynamo-metrics";

/**
 * Success body for delete operations.
 */
export type CiDeleteItemBody<T = Record<string, any>> = {
  attributes?: T;
  consumedCapacity?: ConsumedCapacity;
  itemCollectionMetrics?: ItemCollectionMetrics;
  metadata: MetadataBearer["$metadata"];
  warnings?: string[];
};

/**
 * Union result for `deleteItem`.
 */
export type CiDeleteItemResult<T = Record<string, any>> = CiResult<
  CiDeleteItemBody<T>
>;

/**
 * Input for `deleteItem`.
 */
export interface CiDeleteItemOptions<K extends Record<string, any>> {
  tableName: string;
  key: K;
  existence?: Extract<CiDynamoExistenceMode, "any" | "deleteOnly">;
  returnValues?: CiDynamoDeleteReturnValues;
  metrics?: CiDynamoMetricsOption;
}

/**
 * Deletes a single item using DynamoDB DeleteItem.
 *
 * Generic order:
 * - `T` = deleted item shape returned in `body.attributes`
 * - `K` = key shape passed in `opts.key`
 *
 * Semantics:
 * - On success, returns `{ ok: true, body: { attributes?, ... } }`
 * - On failure, returns `{ ok: false, body: { error, details } }`
 * - Conditional delete failures are mapped to statusCode 400
 */
export async function deleteItem<
  T extends Record<string, any>,
  K extends Record<string, any>,
>(
  doc: DynamoDBDocumentClient,
  opts: CiDeleteItemOptions<K>,
): Promise<CiDeleteItemResult<T>> {
  const {
    tableName,
    key,
    existence = "any",
    returnValues = "NONE",
    metrics,
  } = opts;

  const { returnConsumedCapacity, returnItemCollectionMetrics } =
    ciNormalizeDynamoMetrics(metrics);

  const { expression: conditionExpression, names: expressionAttributeNames } =
    ciBuildDynamoExistenceCondition(key, existence);

  try {
    const res = await doc.send(
      new DeleteCommand({
        TableName: tableName,
        Key: key,
        ConditionExpression: conditionExpression,
        ExpressionAttributeNames:
          expressionAttributeNames &&
          Object.keys(expressionAttributeNames).length
            ? expressionAttributeNames
            : undefined,
        ReturnValues: returnValues as DeleteCommandInput["ReturnValues"],
        ReturnConsumedCapacity: returnConsumedCapacity,
        ReturnItemCollectionMetrics: returnItemCollectionMetrics,
      }),
    );

    return {
      ok: true,
      statusCode: 200,
      body: {
        attributes: res.Attributes as T | undefined,
        consumedCapacity: res.ConsumedCapacity,
        itemCollectionMetrics: res.ItemCollectionMetrics,
        metadata: res.$metadata,
      },
    };
  } catch (error) {
    return {
      ok: false,
      statusCode: ciMapDynamoErrorStatus(error, [
        "ConditionalCheckFailedException",
      ]),
      body: {
        error: error instanceof Error ? error.message : String(error),
        details: ciSerializeUnknownError(error),
      },
    };
  }
}
