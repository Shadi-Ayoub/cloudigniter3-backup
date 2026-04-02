import type { MetadataBearer } from "@smithy/types";
import type { ConsumedCapacity } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
  type TransactWriteCommandInput,
} from "@aws-sdk/lib-dynamodb";

import { ciSerializeUnknownError, type CiResult } from "@cloudigniter/core";

/**
 * Success body for transaction writes.
 */
export type TransactWriteBody = {
  consumedCapacity?: ConsumedCapacity[];
  metadata: MetadataBearer["$metadata"];
  warnings?: string[];
};

/**
 * Union result for `transactWrite`.
 */
export type TransactWriteResult = CiResult<TransactWriteBody>;

type Key = Record<string, any>;
type AnyItem = Record<string, any>;

type ExistenceMode = "any" | "insertOnly" | "updateOnly" | "deleteOnly";

type PutOp = {
  mode: "put";
  key: Key;
  item: AnyItem;
  existence?: ExistenceMode;
};

type UpdateOp = {
  mode: "update";
  key: Key;
  update: {
    set?: Record<string, any>;
  };
  existence?: ExistenceMode;
};

type DeleteOp = {
  mode: "delete";
  key: Key;
  existence?: ExistenceMode;
};

export type TransactWriteOp = PutOp | UpdateOp | DeleteOp;

function buildExistenceCondition(key: Key, mode?: ExistenceMode) {
  if (!mode || mode === "any") return undefined;

  const keys = Object.keys(key);
  const names: Record<string, string> = {};
  const checks = keys.map((k, i) => {
    const ph = `#k${i}`;
    names[ph] = k;
    const fn =
      mode === "insertOnly"
        ? "attribute_not_exists"
        : mode === "updateOnly" || mode === "deleteOnly"
        ? "attribute_exists"
        : "";
    return `${fn}(${ph})`;
  });

  return {
    expr: checks.join(" AND "),
    names,
  };
}

function buildUpdateExpression(set?: Record<string, any>) {
  const names: Record<string, string> = {};
  const values: Record<string, any> = {};
  const parts: string[] = [];

  if (set) {
    let i = 0;
    for (const [k, v] of Object.entries(set)) {
      const n = `#n${i}`;
      const pv = `:v${i}`;
      names[n] = k;
      values[pv] = v;
      parts.push(`${n} = ${pv}`);
      i++;
    }
  }

  return {
    UpdateExpression: parts.length ? `SET ${parts.join(", ")}` : undefined,
    ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
    ExpressionAttributeValues: Object.keys(values).length ? values : undefined,
  };
}

/**
 * Performs a DynamoDB TransactWriteItems call.
 *
 * Semantics:
 * - On success, returns `{ ok: true, body: { ... } }`
 * - On error, returns `{ ok: false, body: { error, details } }`
 * - Conditional-like transaction failures are mapped to 400
 */
export async function transactWrite(
  doc: DynamoDBDocumentClient,
  opts: {
    tableName: string;
    items: TransactWriteOp[];
    returnConsumedCapacity?: "NONE" | "TOTAL" | "INDEXES";
  },
): Promise<TransactWriteResult> {
  const { tableName, items, returnConsumedCapacity = "NONE" } = opts;

  try {
    const txItems: NonNullable<TransactWriteCommandInput["TransactItems"]> =
      items.map((op) => {
        if (op.mode === "put") {
          const cond = buildExistenceCondition(
            op.key,
            op.existence === "insertOnly" ? "insertOnly" : undefined,
          );
          return {
            Put: {
              TableName: tableName,
              Item: { ...op.item, ...op.key },
              ConditionExpression: cond?.expr,
              ExpressionAttributeNames:
                cond?.names && Object.keys(cond.names).length
                  ? cond.names
                  : undefined,
            },
          };
        }

        if (op.mode === "delete") {
          const cond = buildExistenceCondition(
            op.key,
            op.existence === "deleteOnly" ? "deleteOnly" : undefined,
          );
          return {
            Delete: {
              TableName: tableName,
              Key: op.key,
              ConditionExpression: cond?.expr,
              ExpressionAttributeNames:
                cond?.names && Object.keys(cond.names).length
                  ? cond.names
                  : undefined,
            },
          };
        }

        const u = buildUpdateExpression(op.update?.set);
        const cond = buildExistenceCondition(
          op.key,
          op.existence === "updateOnly" ? "updateOnly" : undefined,
        );
        const names = {
          ...(u.ExpressionAttributeNames ?? {}),
          ...(cond?.names ?? {}),
        };

        return {
          Update: {
            TableName: tableName,
            Key: op.key,
            UpdateExpression: u.UpdateExpression,
            ExpressionAttributeNames: Object.keys(names).length
              ? names
              : undefined,
            ExpressionAttributeValues: u.ExpressionAttributeValues,
            ConditionExpression: cond?.expr,
          },
        };
      });

    const res = await doc.send(
      new TransactWriteCommand({
        TransactItems: txItems,
        ReturnConsumedCapacity: returnConsumedCapacity,
      }),
    );

    return {
      ok: true,
      statusCode: 200,
      body: {
        consumedCapacity: res.ConsumedCapacity,
        metadata: res.$metadata,
      },
    };
  } catch (error: any) {
    const name = error?.name ?? "";
    const statusCode =
      name === "TransactionCanceledException" ||
      name === "ConditionalCheckFailedException"
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
