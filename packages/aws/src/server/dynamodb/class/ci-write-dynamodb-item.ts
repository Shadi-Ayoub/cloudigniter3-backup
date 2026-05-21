import type { MetadataBearer } from "@smithy/types";
import type {
  ConsumedCapacity,
  ItemCollectionMetrics,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  type PutCommandInput,
  type UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { ciSerializeUnknownError } from "@cloudigniter/core";
import type { CiResult } from "@cloudigniter/core/types";
import type { CiDynamoExistenceMode } from "../types/CiDynamoExistenceMode";
import type { CiDynamoWriteMode } from "../types/CiDynamoWriteMode";
import type { CiDynamoWriteReturnValues } from "../types/CiDynamoWriteReturnValues";
import type { CiDynamoMetricsOption } from "../types/CiDynamoMetricsOption";

type TimestampOptions = {
  enabled?: boolean;
  createdAtField?: string;
  updatedAtField?: string;
  numeric?: boolean;
  nowFactory?: () => string | number;
};

export interface UpdateShape {
  set?: Record<string, any>;
  remove?: string[];
  add?: Record<string, number | Set<any>>;
  delete?: Record<string, Set<any>>;
  rawExpression?: {
    UpdateExpression: string;
    ExpressionAttributeNames?: Record<string, string>;
    ExpressionAttributeValues?: Record<string, any>;
  };
}

export interface OptimisticLock {
  attribute: string;
  expected: string | number | boolean;
}

export interface WriteItemOptions<
  I extends Record<string, any>,
  K extends Record<string, any>,
> {
  tableName: string;
  key: K;
  item?: I;
  update?: UpdateShape;
  mode?: CiDynamoWriteMode;
  existence?: CiDynamoExistenceMode;
  timestamps?: TimestampOptions | boolean;
  optimisticLock?: OptimisticLock;
  returnValues?: CiDynamoWriteReturnValues;
  metrics?: CiDynamoMetricsOption;
}

/**
 * Success body for write operations.
 */
export type WriteItemBody<T = Record<string, any>> = {
  attributes?: T;
  metadata: MetadataBearer["$metadata"];
  consumedCapacity?: ConsumedCapacity;
  itemCollectionMetrics?: ItemCollectionMetrics;
  warnings?: string[];
};

/**
 * Union result for `writeItem`.
 */
export type WriteItemResult<T = Record<string, any>> = CiResult<
  WriteItemBody<T>
>;

const buildExistenceCondition = (
  key: Record<string, any>,
  mode: CiDynamoExistenceMode,
) => {
  if (mode === "any") return { expr: "", names: {} as Record<string, string> };

  const keys = Object.keys(key);
  const names: Record<string, string> = {};

  const checks = keys.map((k, i) => {
    const ph = `#k${i}`;
    names[ph] = k;
    return `${
      mode === "insertOnly" ? "attribute_not_exists" : "attribute_exists"
    }(${ph})`;
  });

  return { expr: checks.join(" AND "), names };
};

function normalizeTimestamps(
  t?: TimestampOptions | boolean,
): Required<TimestampOptions> {
  if (t === false) {
    return {
      enabled: false,
      createdAtField: "createdAt",
      updatedAtField: "updatedAt",
      numeric: false,
      nowFactory: () => new Date().toISOString(),
    };
  }

  if (t === true || t === undefined) {
    return {
      enabled: true,
      createdAtField: "createdAt",
      updatedAtField: "updatedAt",
      numeric: false,
      nowFactory: () => new Date().toISOString(),
    };
  }

  const numeric = !!t.numeric;

  return {
    enabled: t.enabled ?? true,
    createdAtField: t.createdAtField ?? "createdAt",
    updatedAtField: t.updatedAtField ?? "updatedAt",
    numeric,
    nowFactory:
      t.nowFactory ?? (() => (numeric ? Date.now() : new Date().toISOString())),
  };
}

const normalizeMetrics = (m?: CiDynamoMetricsOption) => {
  if (!m) return { rcc: "NONE" as const, ricm: "NONE" as const };
  if (m === true) return { rcc: "TOTAL" as const, ricm: "SIZE" as const };

  return {
    rcc: m.returnConsumedCapacity ?? ("NONE" as const),
    ricm: m.returnItemCollectionMetrics ?? ("NONE" as const),
  };
};

const buildUpdateParts = (u: UpdateShape | undefined) => {
  if (!u) {
    return {
      UpdateExpression: "",
      Names: {} as Record<string, string>,
      Values: {} as Record<string, any>,
    };
  }

  if (u.rawExpression) {
    return {
      UpdateExpression: u.rawExpression.UpdateExpression,
      Names: u.rawExpression.ExpressionAttributeNames ?? {},
      Values: u.rawExpression.ExpressionAttributeValues ?? {},
    };
  }

  const names: Record<string, string> = {};
  const values: Record<string, any> = {};

  const segSET: string[] = [];
  const segREMOVE: string[] = [];
  const segADD: string[] = [];
  const segDELETE: string[] = [];

  let idx = 0;

  const namePH = (attr: string) => {
    const ph = `#n${idx++}`;
    names[ph] = attr;
    return ph;
  };

  const valuePH = (attr: string) =>
    `:v_${attr.replace(/[^a-zA-Z0-9]/g, "_")}_${idx++}`;

  if (u.set) {
    for (const [k, v] of Object.entries(u.set)) {
      const n = namePH(k);
      const pv = valuePH(k);
      values[pv] = v;
      segSET.push(`${n} = ${pv}`);
    }
  }

  if (u.remove?.length) {
    for (const k of u.remove) segREMOVE.push(namePH(k));
  }

  if (u.add) {
    for (const [k, v] of Object.entries(u.add)) {
      const n = namePH(k);
      const pv = valuePH(k);
      values[pv] = v;
      segADD.push(`${n} ${pv}`);
    }
  }

  if (u.delete) {
    for (const [k, v] of Object.entries(u.delete)) {
      const n = namePH(k);
      const pv = valuePH(k);
      values[pv] = v;
      segDELETE.push(`${n} ${pv}`);
    }
  }

  const parts: string[] = [];
  if (segSET.length) parts.push(`SET ${segSET.join(", ")}`);
  if (segREMOVE.length) parts.push(`REMOVE ${segREMOVE.join(", ")}`);
  if (segADD.length) parts.push(`ADD ${segADD.join(", ")}`);
  if (segDELETE.length) parts.push(`DELETE ${segDELETE.join(", ")}`);

  return { UpdateExpression: parts.join(" "), Names: names, Values: values };
};

/**
 * Unified DynamoDB write helper.
 *
 * Supports:
 * - PutCommand
 * - UpdateCommand
 *
 * Returns a `CiResult`.
 */
export async function writeItem<
  I extends Record<string, any>,
  K extends Record<string, any>,
>(
  doc: DynamoDBDocumentClient,
  opts: WriteItemOptions<I, K>,
): Promise<WriteItemResult<Record<string, any>>> {
  const {
    tableName,
    key,
    item,
    update,
    mode = "auto",
    existence = "any",
    optimisticLock,
    returnValues = "NONE",
    metrics,
  } = opts;

  const ts = normalizeTimestamps(opts.timestamps);
  const { rcc, ricm } = normalizeMetrics(metrics);
  const warnings: string[] = [];

  const chosen: CiDynamoWriteMode =
    mode === "auto" ? (update ? "update" : "put") : mode;
  const { expr: existenceExpr, names: existenceNames } =
    buildExistenceCondition(key, existence);

  let lockExpr = "";
  const lockNames: Record<string, string> = {};
  const lockValues: Record<string, any> = {};

  if (optimisticLock) {
    lockNames["#__lock"] = optimisticLock.attribute;
    lockValues[":__expected"] = optimisticLock.expected;
    lockExpr = "#__lock = :__expected";
  }

  const combineConds = (...conds: string[]) =>
    conds.filter(Boolean).join(" AND ") || undefined;

  try {
    if (chosen === "put") {
      let rv: PutCommandInput["ReturnValues"] = "NONE";

      if (returnValues === "ALL_OLD") rv = "ALL_OLD";
      else if (returnValues !== "NONE") {
        warnings.push(
          `PutCommand does not support ReturnValues="${returnValues}". Using "NONE".`,
        );
      }

      const now = ts.nowFactory();

      const finalItem = ts.enabled
        ? {
            [ts.createdAtField]: ts.numeric ? Number(now) : now,
            [ts.updatedAtField]: ts.numeric ? Number(now) : now,
            ...(item as object),
            ...key,
          }
        : { ...(item as object), ...key };

      const condition = combineConds(existenceExpr, lockExpr);

      const namesPut = condition
        ? { ...existenceNames, ...lockNames }
        : undefined;
      const valuesPut = condition ? { ...lockValues } : undefined;

      const finalNamesPut =
        namesPut && Object.keys(namesPut).length ? namesPut : undefined;
      const finalValuesPut =
        valuesPut && Object.keys(valuesPut).length ? valuesPut : undefined;

      const res = await doc.send(
        new PutCommand({
          TableName: tableName,
          Item: finalItem,
          ConditionExpression: condition,
          ExpressionAttributeNames: finalNamesPut,
          ExpressionAttributeValues: finalValuesPut,
          ReturnValues: rv,
          ReturnConsumedCapacity: rcc,
          ReturnItemCollectionMetrics: ricm,
        }),
      );

      return {
        ok: true,
        statusCode: 200,
        body: {
          attributes: res.Attributes as any,
          consumedCapacity: res.ConsumedCapacity,
          itemCollectionMetrics: res.ItemCollectionMetrics,
          metadata: res.$metadata,
          warnings,
        },
      };
    }

    const {
      UpdateExpression: uExpr0,
      Names: uNames0,
      Values: uValues0,
    } = buildUpdateParts(update);

    let uExpr = uExpr0;
    const names: Record<string, string> = { ...uNames0 };
    const values: Record<string, any> = { ...uValues0 };

    if (ts.enabled) {
      const now = ts.nowFactory();

      names["#__createdAt"] = ts.createdAtField;
      names["#__updatedAt"] = ts.updatedAtField;
      values[":__now"] = ts.numeric ? Number(now) : now;

      const tsSet =
        "#__createdAt = if_not_exists(#__createdAt, :__now), #__updatedAt = :__now";

      if (!uExpr) uExpr = `SET ${tsSet}`;
      else if (uExpr.startsWith("SET "))
        uExpr = uExpr.replace(/^SET\s+/, `SET ${tsSet}, `);
      else
        uExpr = `SET ${tsSet} ${
          uExpr.startsWith("REMOVE") ? "" : ","
        } ${uExpr}`;
    }

    const condition = combineConds(existenceExpr, lockExpr);
    const finalUpdateExpression = uExpr || "SET #__noop = :__noop";

    const namesUpdate: Record<string, string> = {
      ...names,
      ...(condition ? { ...existenceNames, ...lockNames } : undefined),
      ...(finalUpdateExpression.includes("#__noop")
        ? { "#__noop": "__noop" }
        : undefined),
    };

    const valuesUpdate: Record<string, any> = {
      ...values,
      ...(condition ? { ...lockValues } : undefined),
      ...(finalUpdateExpression.includes(":__noop")
        ? { ":__noop": 1 }
        : undefined),
    };

    const finalNamesUpdate = Object.keys(namesUpdate).length
      ? namesUpdate
      : undefined;
    const finalValuesUpdate = Object.keys(valuesUpdate).length
      ? valuesUpdate
      : undefined;

    const res = await doc.send(
      new UpdateCommand({
        TableName: tableName,
        Key: key,
        UpdateExpression: finalUpdateExpression,
        ExpressionAttributeNames: finalNamesUpdate,
        ExpressionAttributeValues: finalValuesUpdate,
        ConditionExpression: condition,
        ReturnValues:
          (returnValues as UpdateCommandInput["ReturnValues"]) ?? "NONE",
        ReturnConsumedCapacity: rcc,
        ReturnItemCollectionMetrics: ricm,
      }),
    );

    return {
      ok: true,
      statusCode: 200,
      body: {
        attributes: res.Attributes as any,
        consumedCapacity: res.ConsumedCapacity,
        itemCollectionMetrics: res.ItemCollectionMetrics,
        metadata: res.$metadata,
        warnings,
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
