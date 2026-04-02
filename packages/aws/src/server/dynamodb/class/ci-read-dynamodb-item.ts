import type { MetadataBearer } from "@smithy/types";
import type { ConsumedCapacity } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  type GetCommandInput,
} from "@aws-sdk/lib-dynamodb";

import { ciSerializeUnknownError, type CiResult } from "@cloudigniter/core";

/**
 * Metrics option for read operations (GetItem).
 *
 * - `false | undefined` => no consumed capacity info
 * - `true`              => total consumed capacity
 * - object              => explicit control
 */
export type MetricsOption =
  | boolean
  | {
      returnConsumedCapacity?: "NONE" | "TOTAL" | "INDEXES";
    };

/**
 * Success body for read operations.
 */
export type ReadItemBody<T = Record<string, any>> = {
  item?: T;
  consumedCapacity?: ConsumedCapacity;
  metadata: MetadataBearer["$metadata"];
  warnings?: string[];
};

/**
 * Union result for `readItem`.
 */
export type ReadItemResult<T = Record<string, any>> = CiResult<ReadItemBody<T>>;

/**
 * Ways to specify a projection (ProjectionExpression).
 */
export type ProjectionInput =
  | string[]
  | Record<string, true>
  | { expression: string; names?: Record<string, string> }
  | string
  | boolean
  | undefined
  | null;

/**
 * Normalizes metrics input to a concrete ReturnConsumedCapacity value.
 */
const normalizeMetrics = (m?: MetricsOption) => {
  if (!m) return { rcc: "NONE" as const };
  if (m === true) return { rcc: "TOTAL" as const };
  return { rcc: m.returnConsumedCapacity ?? ("NONE" as const) };
};

function isRawProjection(
  p: ProjectionInput,
): p is { expression: string; names?: Record<string, string> } {
  return (
    !!p &&
    typeof p === "object" &&
    !Array.isArray(p) &&
    typeof (p as any).expression === "string"
  );
}

function isAttrMap(p: ProjectionInput): p is Record<string, true> {
  return (
    !!p &&
    typeof p === "object" &&
    !Array.isArray(p) &&
    (p as any).expression === undefined
  );
}

/**
 * Builds DynamoDB projection fields from the supported `ProjectionInput` forms.
 */
function buildProjection(p?: ProjectionInput): {
  ProjectionExpression?: string;
  ExpressionAttributeNames?: Record<string, string>;
} {
  if (p == null || p === true || p === false) return {};

  if (Array.isArray(p)) {
    if (p.length === 0) return {};
    const names: Record<string, string> = {};
    const parts = p.map((attr, i) => {
      const ph = `#p${i}`;
      names[ph] = attr;
      return ph;
    });
    return {
      ProjectionExpression: parts.join(", "),
      ExpressionAttributeNames: names,
    };
  }

  if (typeof p === "string") {
    const expr = p.trim();
    return expr ? { ProjectionExpression: expr } : {};
  }

  if (isRawProjection(p)) {
    const expr = p.expression.trim();
    return expr
      ? { ProjectionExpression: expr, ExpressionAttributeNames: p.names }
      : {};
  }

  if (isAttrMap(p)) {
    const keys = Object.keys(p);
    if (keys.length === 0) return {};
    const names: Record<string, string> = {};
    const parts = keys.map((attr, i) => {
      const ph = `#p${i}`;
      names[ph] = attr;
      return ph;
    });
    return {
      ProjectionExpression: parts.join(", "),
      ExpressionAttributeNames: names,
    };
  }

  return {};
}

/**
 * Reads a single item by primary key using DynamoDB `GetItem`.
 *
 * Semantics:
 * - If the item does not exist, returns `{ ok: true, body: { item: undefined } }`
 * - If an AWS error occurs, returns `{ ok: false, body: { error, details } }`
 */
export async function readItem<
  T extends Record<string, any>,
  K extends Record<string, any>,
>(
  doc: DynamoDBDocumentClient,
  opts: {
    tableName: string;
    key: K;
    projection?: ProjectionInput;
    consistent?: boolean;
    metrics?: MetricsOption;
  },
): Promise<ReadItemResult<T>> {
  const { tableName, key, projection, consistent = false, metrics } = opts;
  const { rcc } = normalizeMetrics(metrics);
  const { ProjectionExpression, ExpressionAttributeNames } =
    buildProjection(projection);

  try {
    const res = await doc.send(
      new GetCommand({
        TableName: tableName,
        Key: key,
        ProjectionExpression,
        ExpressionAttributeNames,
        ConsistentRead: consistent,
        ReturnConsumedCapacity:
          rcc as GetCommandInput["ReturnConsumedCapacity"],
      }),
    );

    return {
      ok: true,
      statusCode: 200,
      body: {
        item: res.Item as T | undefined,
        consumedCapacity: res.ConsumedCapacity,
        metadata: res.$metadata,
      },
    };
  } catch (error) {
    const statusCode =
      (error as { $metadata?: { httpStatusCode?: number } })?.$metadata
        ?.httpStatusCode === 400 ||
      (error as { $metadata?: { httpStatusCode?: number } })?.$metadata
        ?.httpStatusCode === 401 ||
      (error as { $metadata?: { httpStatusCode?: number } })?.$metadata
        ?.httpStatusCode === 403 ||
      (error as { $metadata?: { httpStatusCode?: number } })?.$metadata
        ?.httpStatusCode === 404 ||
      (error as { $metadata?: { httpStatusCode?: number } })?.$metadata
        ?.httpStatusCode === 409
        ? ((error as { $metadata?: { httpStatusCode?: number } }).$metadata
            ?.httpStatusCode as 400 | 401 | 403 | 404 | 409)
        : 500;

    return {
      ok: false,
      statusCode,
      body: {
        error: error instanceof Error ? error.message : String(error),
        details: ciSerializeUnknownError(error),
      },
    };
  }
}
