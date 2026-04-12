import type { MetadataBearer } from "@smithy/types";
import type { ConsumedCapacity } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
  type TransactWriteCommandInput,
} from "@aws-sdk/lib-dynamodb";

import { ciSerializeUnknownError, type CiResult } from "@cloudigniter/core";

import type { CiDynamoExistenceMode } from "../types/CiDynamoExistenceMode";
import { ciBuildDynamoExistenceCondition } from "../helpers/ci-build-dynamo-existence-condition";
import { ciMapDynamoErrorStatus } from "../helpers/ci-map-dynamo-error-status";

/**
 * Success body for transaction writes.
 */
export type CiTransactWriteBody = {
  consumedCapacity?: ConsumedCapacity[];
  metadata: MetadataBearer["$metadata"];
  warnings?: string[];
};

/**
 * Union result for `transactWrite`.
 */
export type CiTransactWriteResult = CiResult<CiTransactWriteBody>;

type CiKey = Record<string, any>;
type CiAnyItem = Record<string, any>;

type CiPutTransactWriteOp = {
  mode: "put";
  key: CiKey;
  item: CiAnyItem;
  existence?: Extract<CiDynamoExistenceMode, "any" | "insertOnly">;
};

type CiUpdateTransactWriteOp = {
  mode: "update";
  key: CiKey;
  update: {
    set?: Record<string, any>;
  };
  existence?: Extract<CiDynamoExistenceMode, "any" | "updateOnly">;
};

type CiDeleteTransactWriteOp = {
  mode: "delete";
  key: CiKey;
  existence?: Extract<CiDynamoExistenceMode, "any" | "deleteOnly">;
};

export type CiTransactWriteOp =
  | CiPutTransactWriteOp
  | CiUpdateTransactWriteOp
  | CiDeleteTransactWriteOp;

function ciBuildUpdateExpression(set?: Record<string, any>) {
  const names: Record<string, string> = {};
  const values: Record<string, any> = {};
  const parts: string[] = [];

  if (set) {
    let index = 0;

    for (const [key, value] of Object.entries(set)) {
      const namePlaceholder = `#n${index}`;
      const valuePlaceholder = `:v${index}`;

      names[namePlaceholder] = key;
      values[valuePlaceholder] = value;
      parts.push(`${namePlaceholder} = ${valuePlaceholder}`);
      index++;
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
    items: CiTransactWriteOp[];
    returnConsumedCapacity?: "NONE" | "TOTAL" | "INDEXES";
  },
): Promise<CiTransactWriteResult> {
  const { tableName, items, returnConsumedCapacity = "NONE" } = opts;

  try {
    const transactItems: NonNullable<
      TransactWriteCommandInput["TransactItems"]
    > = items.map((item) => {
      if (item.mode === "put") {
        const existence = ciBuildDynamoExistenceCondition(
          item.key,
          item.existence ?? "any",
        );

        return {
          Put: {
            TableName: tableName,
            Item: { ...item.item, ...item.key },
            ConditionExpression: existence.expression,
            ExpressionAttributeNames:
              existence.names && Object.keys(existence.names).length
                ? existence.names
                : undefined,
          },
        };
      }

      if (item.mode === "delete") {
        const existence = ciBuildDynamoExistenceCondition(
          item.key,
          item.existence ?? "any",
        );

        return {
          Delete: {
            TableName: tableName,
            Key: item.key,
            ConditionExpression: existence.expression,
            ExpressionAttributeNames:
              existence.names && Object.keys(existence.names).length
                ? existence.names
                : undefined,
          },
        };
      }

      const update = ciBuildUpdateExpression(item.update?.set);
      const existence = ciBuildDynamoExistenceCondition(
        item.key,
        item.existence ?? "any",
      );

      const names = {
        ...(update.ExpressionAttributeNames ?? {}),
        ...(existence.names ?? {}),
      };

      return {
        Update: {
          TableName: tableName,
          Key: item.key,
          UpdateExpression: update.UpdateExpression,
          ExpressionAttributeNames: Object.keys(names).length
            ? names
            : undefined,
          ExpressionAttributeValues: update.ExpressionAttributeValues,
          ConditionExpression: existence.expression,
        },
      };
    });

    const res = await doc.send(
      new TransactWriteCommand({
        TransactItems: transactItems,
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
  } catch (error) {
    return {
      ok: false,
      statusCode: ciMapDynamoErrorStatus(error, [
        "TransactionCanceledException",
        "ConditionalCheckFailedException",
      ]),
      body: {
        error: error instanceof Error ? error.message : String(error),
        details: ciSerializeUnknownError(error),
      },
    };
  }
}
