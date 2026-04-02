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

import { ciSerializeUnknownError, type CiResult } from "@cloudigniter/core";

type ReturnValuesAny = "NONE" | "ALL_OLD";
type ExistenceMode = "any" | "deleteOnly";

export type MetricsOption =
  | boolean
  | {
      returnConsumedCapacity?: "NONE" | "TOTAL" | "INDEXES";
      returnItemCollectionMetrics?: "NONE" | "SIZE";
    };

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

const ciNormalizeMetrics = (m?: MetricsOption) => {
  if (!m) return { rcc: "NONE" as const, ricm: "NONE" as const };
  if (m === true) return { rcc: "TOTAL" as const, ricm: "SIZE" as const };

  return {
    rcc: m.returnConsumedCapacity ?? ("NONE" as const),
    ricm: m.returnItemCollectionMetrics ?? ("NONE" as const),
  };
};

/**
 * Deletes a single item using DynamoDB `DeleteItem`.
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
  opts: {
    tableName: string;
    key: K;
    existence?: ExistenceMode;
    returnValues?: ReturnValuesAny;
    metrics?: MetricsOption;
  },
): Promise<CiDeleteItemResult<T>> {
  const {
    tableName,
    key,
    existence = "any",
    returnValues = "NONE",
    metrics,
  } = opts;

  const { rcc, ricm } = ciNormalizeMetrics(metrics);

  const condition =
    existence === "deleteOnly"
      ? Object.keys(key)
          .map((_, i) => `attribute_exists(#k${i})`)
          .join(" AND ")
      : undefined;

  const names =
    existence === "deleteOnly"
      ? Object.keys(key).reduce<Record<string, string>>((acc, k, i) => {
          acc[`#k${i}`] = k;
          return acc;
        }, {})
      : undefined;

  try {
    const res = await doc.send(
      new DeleteCommand({
        TableName: tableName,
        Key: key,
        ConditionExpression: condition,
        ExpressionAttributeNames:
          names && Object.keys(names).length ? names : undefined,
        ReturnValues: returnValues as DeleteCommandInput["ReturnValues"],
        ReturnConsumedCapacity: rcc,
        ReturnItemCollectionMetrics: ricm,
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
  } catch (error: any) {
    const statusCode =
      error?.name === "ConditionalCheckFailedException"
        ? 400
        : error?.$metadata?.httpStatusCode === 401 ||
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
