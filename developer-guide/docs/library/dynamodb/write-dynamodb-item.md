# `writeItem`

A single, typed helper that unifies **Put** and **Update** behaviors for DynamoDB using `@aws-sdk/lib-dynamodb`. It supports:

- **Upsert / insert-only / update-only** via conditions
- **Automatic timestamps** (`createdAt` / `updatedAt`) with ISO or epoch millis
- **Optimistic locking** (`version`/`updatedAt` checks)
- **Metrics toggles** (`ReturnConsumedCapacity`, `ReturnItemCollectionMetrics`)
- **Smart return values** (`ALL_NEW`, `UPDATED_NEW`, etc.)
- **Command switching**: choose **Put** or **Update**, or let it pick automatically

---

## Table of Contents

- [`writeItem`](#writeitem)
  - [Table of Contents](#table-of-contents)
  - [Installation \& Imports](#installation--imports)
  - [API Overview](#api-overview)
  - [Behavior Matrix](#behavior-matrix)
  - [Timestamps](#timestamps)
  - [Metrics](#metrics)
  - [Optimistic Locking](#optimistic-locking)
  - [Return Values](#return-values)
  - [Examples](#examples)
    - [Quick Start (Upsert, ALL\_NEW)](#quick-start-upsert-all_new)
    - [Insert-Only (Put)](#insert-only-put)
    - [Update-Only (Update)](#update-only-update)
    - [Replace-Only-If-Exists (Put)](#replace-only-if-exists-put)
    - [Upsert (Update)](#upsert-update)
    - [Atomic Counter (ADD)](#atomic-counter-add)
    - [Removing Attributes](#removing-attributes)
    - [Raw UpdateExpression](#raw-updateexpression)
    - [Disable Timestamps](#disable-timestamps)
    - [Numeric Timestamps (epoch/ms)](#numeric-timestamps-epochms)
    - [Custom nowFactory](#custom-nowfactory)
    - [With Metrics (ALL)](#with-metrics-all)
    - [Fine-Grained Metrics](#fine-grained-metrics)
    - [Optimistic Lock (version check)](#optimistic-lock-version-check)
  - [Result Shape](#result-shape)
  - [Full Source Code](#full-source-code)
  - [Gotchas \& Notes](#gotchas--notes)
  - [FAQ / Troubleshooting](#faq--troubleshooting)

---

## Installation & Imports

```bash
npm i @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

```ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const ddb = new DynamoDBClient({});
export const doc = DynamoDBDocumentClient.from(ddb);
```

---

## API Overview

```ts
export type ExistenceMode = "any" | "insertOnly" | "updateOnly"; // upsert | put-if-absent | update-if-present
export type WriteMode = "auto" | "put" | "update"; // auto infers from presence of `update`
export type ReturnValuesAny =
  | "NONE"
  | "ALL_OLD"
  | "ALL_NEW"
  | "UPDATED_NEW"
  | "UPDATED_OLD";

export type MetricsOption =
  | boolean
  | {
      returnConsumedCapacity?: "NONE" | "TOTAL" | "INDEXES";
      returnItemCollectionMetrics?: "NONE" | "SIZE";
    };

export interface TimestampOptions {
  enabled?: boolean; // default: true
  createdAtField?: string; // default: "createdAt"
  updatedAtField?: string; // default: "updatedAt"
  numeric?: boolean; // default: false (ISO strings)
  nowFactory?: () => string | number; // default derived from `numeric`
}

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
  attribute: string; // e.g., "version" or "updatedAt"
  expected: string | number | boolean; // expected current value
}

export interface WriteItemOptions<
  I extends Record<string, any>,
  K extends Record<string, any>
> {
  tableName: string;
  key: K; // { pk, sk? } or { id }
  item?: I; // for Put
  update?: UpdateShape; // for Update
  mode?: WriteMode; // default "auto"
  existence?: ExistenceMode; // default "any"
  timestamps?: TimestampOptions | boolean; // default true
  optimisticLock?: OptimisticLock; // optional
  returnValues?: ReturnValuesAny; // default "NONE"
  metrics?: MetricsOption; // default false
}

export type WriteItemResult<T = Record<string, any>> =
  | {
      ok: true;
      attributes?: T;
      metadata: any;
      consumedCapacity?: any;
      itemCollectionMetrics?: any;
      warnings?: string[];
    }
  | { ok: false; statusCode: number; error: string; originalError?: unknown };
```

- **Command selection**: `mode:"auto"` picks **Update** if `update` is provided; otherwise **Put**.
- **Existence control**: `insertOnly` → `attribute_not_exists(key)`; `updateOnly` → `attribute_exists(key)`; `any` → none.
- **Timestamps**: On Put, both `createdAt` and `updatedAt` are set; on Update, `createdAt = if_not_exists(...), updatedAt = now`.

---

## Behavior Matrix

| Option                                 | Effect                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------- |
| `mode: "put"`                          | Full replace (create or overwrite).                                       |
| `mode: "update"`                       | Partial update (create if missing unless `updateOnly`).                   |
| `existence: "insertOnly"`              | Fails if item already exists.                                             |
| `existence: "updateOnly"`              | Fails if item does **not** exist.                                         |
| `timestamps: true`                     | Auto-manage `createdAt`/`updatedAt`.                                      |
| `timestamps: false`                    | Do not touch timestamps.                                                  |
| `metrics: true`                        | `ReturnConsumedCapacity: "TOTAL"`, `ReturnItemCollectionMetrics: "SIZE"`. |
| `returnValues: "ALL_NEW"` (Update)     | Returns full item after update.                                           |
| `returnValues: "ALL_OLD"` (Put/Update) | Returns full item before write.                                           |

> **Note:** `Put` only supports `NONE` and `ALL_OLD`. `Update` supports all `ReturnValues` variants.

---

## Timestamps

- **Enabled (default):**
  - **Put:** writes both `createdAt` and `updatedAt` to `now` (ISO string by default).
  - **Update:** `createdAt = if_not_exists(createdAt, now)` and `updatedAt = now`.
- **Disable:** pass `timestamps: false`.
- **Numeric:** pass `timestamps: { numeric: true }` to store epoch millis.
- **Custom clock:** pass `timestamps: { nowFactory: () => ... }`.

---

## Metrics

Control capacity & item-collection metrics returned by DynamoDB:

- `metrics: false` (default) ⇒ `NONE` / `NONE`
- `metrics: true` ⇒ `TOTAL` / `SIZE`
- Fine-grained:

  ```ts
  metrics: { returnConsumedCapacity: "INDEXES", returnItemCollectionMetrics: "NONE" }
  ```

Returned metrics (when requested) land on `result.consumedCapacity` and `result.itemCollectionMetrics`.

---

## Optimistic Locking

Protect against lost updates using a condition on an attribute (e.g., `version` or `updatedAt`). If the stored value differs, the write fails with `ConditionalCheckFailedException` (the helper maps it to `statusCode: 400`).

```ts
optimisticLock: { attribute: "version", expected: 3 }
```

Combine with increments to bump the version.

---

## Return Values

- **Put:** `NONE` (default) or `ALL_OLD`.
- **Update:** `NONE` (default), `ALL_OLD`, `UPDATED_OLD`, `ALL_NEW`, `UPDATED_NEW`.

Use `ALL_NEW` when you want the _entire updated item_ back, commonly for upsert/update flows.

---

## Examples

### Quick Start (Upsert, ALL_NEW)

```ts
const res = await writeItem(doc, {
  tableName: "Users",
  key: { pk: "USER#123", sk: "PROFILE" },
  update: { set: { name: "Ada", isActive: true } },
  returnValues: "ALL_NEW",
});
```

### Insert-Only (Put)

```ts
const res = await writeItem(doc, {
  tableName: "Users",
  key: { pk: "USER#123", sk: "PROFILE" },
  item: { email: "a@b.com", isActive: true },
  mode: "put",
  existence: "insertOnly", // fail if already exists
  timestamps: true, // default
  returnValues: "ALL_OLD", // Put supports NONE | ALL_OLD
});
```

### Update-Only (Update)

```ts
const res = await writeItem(doc, {
  tableName: "Users",
  key: { pk: "USER#123", sk: "PROFILE" },
  update: { set: { isActive: false } },
  existence: "updateOnly", // require existing item
  returnValues: "ALL_NEW",
});
```

### Replace-Only-If-Exists (Put)

```ts
const res = await writeItem(doc, {
  tableName: "Users",
  key: { pk: "USER#123", sk: "PROFILE" },
  item: { email: "new@x.com", isActive: true },
  mode: "put",
  existence: "updateOnly", // only replace if exists
  returnValues: "ALL_OLD",
});
```

### Upsert (Update)

```ts
const res = await writeItem(doc, {
  tableName: "Users",
  key: { pk: "USER#234", sk: "PROFILE" },
  update: { set: { plan: "pro" } }, // creates item if missing
  returnValues: "ALL_NEW",
});
```

### Atomic Counter (ADD)

```ts
const res = await writeItem(doc, {
  tableName: "Users",
  key: { pk: "USER#123", sk: "PROFILE" },
  update: { add: { loginCount: 1 } }, // atomic increment
  returnValues: "UPDATED_NEW", // only changed attributes (new values)
});
```

### Removing Attributes

```ts
const res = await writeItem(doc, {
  tableName: "Users",
  key: { pk: "USER#123", sk: "PROFILE" },
  update: { remove: ["temporaryFlag", "legacyField"] },
  existence: "updateOnly",
  returnValues: "ALL_NEW",
});
```

### Raw UpdateExpression

```ts
const res = await writeItem(doc, {
  tableName: "Users",
  key: { pk: "USER#123", sk: "PROFILE" },
  update: {
    rawExpression: {
      UpdateExpression:
        "SET #data = :data, #score = if_not_exists(#score, :z) + :one",
      ExpressionAttributeNames: { "#data": "data", "#score": "score" },
      ExpressionAttributeValues: { ":data": { likes: 42 }, ":z": 0, ":one": 1 },
    },
  },
  returnValues: "ALL_NEW",
});
```

### Disable Timestamps

```ts
await writeItem(doc, {
  tableName: "Users",
  key: { pk: "USER#1", sk: "PROFILE" },
  update: { set: { nickname: "A" } },
  timestamps: false,
});
```

### Numeric Timestamps (epoch/ms)

```ts
await writeItem(doc, {
  tableName: "Users",
  key: { pk: "USER#1", sk: "PROFILE" },
  update: { set: { nickname: "B" } },
  timestamps: { numeric: true },
});
```

### Custom nowFactory

```ts
await writeItem(doc, {
  tableName: "Users",
  key: { pk: "USER#1", sk: "PROFILE" },
  update: { set: { emailVerified: true } },
  timestamps: {
    nowFactory: () => new Date("2025-01-01T00:00:00Z").toISOString(),
  },
});
```

### With Metrics (ALL)

```ts
const res = await writeItem(doc, {
  tableName: "Users",
  key: { pk: "USER#1", sk: "PROFILE" },
  item: { email: "a@b.com" },
  mode: "put",
  metrics: true, // ReturnConsumedCapacity: "TOTAL", ReturnItemCollectionMetrics: "SIZE"
});

console.log(res.consumedCapacity, res.itemCollectionMetrics);
```

### Fine-Grained Metrics

```ts
await writeItem(doc, {
  tableName: "Users",
  key: { pk: "USER#1", sk: "PROFILE" },
  update: { set: { locale: "en" } },
  metrics: {
    returnConsumedCapacity: "INDEXES",
    returnItemCollectionMetrics: "NONE",
  },
});
```

### Optimistic Lock (version check)

```ts
// Expect current version = 3; bump to 4 in the same update
const res = await writeItem(doc, {
  tableName: "Users",
  key: { pk: "USER#9", sk: "PROFILE" },
  update: { set: { version: 4, email: "new@example.com" } },
  optimisticLock: { attribute: "version", expected: 3 },
  existence: "updateOnly",
  returnValues: "ALL_NEW",
});

if (!res.ok && res.statusCode === 400) {
  // ConditionalCheckFailedException — someone beat us to it
}
```

---

## Result Shape

```ts
if (res.ok) {
  res.attributes; // undefined unless ReturnValues requested
  res.consumedCapacity; // only when metrics requested
  res.itemCollectionMetrics; // only when metrics requested
  res.metadata; // SDK metadata ($metadata)
  res.warnings; // downgraded returnValues, etc.
} else {
  res.statusCode; // 400 for condition failure, else httpStatusCode or 500
  res.error; // error message
}
```

---

## Full Source Code

> Drop-in helper. Includes the **timestamp narrowing fix** and **metrics option**.

```ts
// utils/dynamo/writeItem.ts
import type { MetadataBearer } from "@smithy/types";
import type { ConsumedCapacity, ItemCollectionMetrics } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  type PutCommandInput,
  type UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";

export type ExistenceMode = "any" | "insertOnly" | "updateOnly";
export type WriteMode = "auto" | "put" | "update";
export type ReturnValuesAny = "NONE" | "ALL_OLD" | "ALL_NEW" | "UPDATED_NEW" | "UPDATED_OLD";

export type MetricsOption =
  | boolean
  | {
      returnConsumedCapacity?: "NONE" | "TOTAL" | "INDEXES";
      returnItemCollectionMetrics?: "NONE" | "SIZE";
    };

export interface TimestampOptions {
  enabled?: boolean;
  createdAtField?: string;
  updatedAtField?: string;
  numeric?: boolean;
  nowFactory?: () => string | number;
}

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

export interface WriteItemOptions<I extends Record<string, any>, K extends Record<string, any>> {
  tableName: string;
  key: K;
  item?: I;                       // for Put
  update?: UpdateShape;           // for Update
  mode?: WriteMode;               // default "auto"
  existence?: ExistenceMode;      // default "any"
  timestamps?: TimestampOptions | boolean; // default true
  optimisticLock?: OptimisticLock;
  returnValues?: ReturnValuesAny; // default "NONE"
  metrics?: MetricsOption;        // default false
}

export type WriteItemResult<T = Record<string, any>> =
  | {
      ok: true;
      attributes?: T;
      metadata: MetadataBearer["$metadata"];
      consumedCapacity?: ConsumedCapacity;
      itemCollectionMetrics?: ItemCollectionMetrics;
      warnings?: string[];
    }
  | { ok: false; statusCode: number; error: string; originalError?: unknown };

const buildExistenceCondition = (key: Record<string, any>, mode: ExistenceMode) => {
  if (mode === "any") return { expr: "", names: {} as Record<string, string> };
  const keys = Object.keys(key);
  const names: Record<string, string> = {};
  const checks = keys.map((k, i) => {
    const ph = `#k${i}`;
    names[ph] = k;
    return `${mode === "insertOnly" ? "attribute_not_exists" : "attribute_exists"}(${ph})`;
  });
  return { expr: checks.join(" AND "), names };
};

function normalizeTimestamps(t?: TimestampOptions | boolean): Required<TimestampOptions> {
  // Explicitly disabled
  if (t === false) {
    return {
      enabled: false,
      createdAtField: "createdAt",
      updatedAtField: "updatedAt",
      numeric: false,
      nowFactory: () => new Date().toISOString(),
    };
  }
  // Default or true
  if (t === true || t === undefined) {
    return {
      enabled: true,
      createdAtField: "createdAt",
      updatedAtField: "updatedAt",
      numeric: false,
      nowFactory: () => new Date().toISOString(),
    };
  }
  // Object case
  const numeric = !!t.numeric;
  return {
    enabled: t.enabled ?? true,
    createdAtField: t.createdAtField ?? "createdAt",
    updatedAtField: t.updatedAtField ?? "updatedAt",
    numeric,
    nowFactory: t.nowFactory ?? (() => (numeric ? Date.now() : new Date().toISOString())),
  };
}

const normalizeMetrics = (m?: MetricsOption) => {
  if (!m) return { rcc: "NONE" as const, ricm: "NONE" as const };
  if (m === true) return { rcc: "TOTAL" as const, ricm: "SIZE" as const };
  return {
    rcc: m.returnConsumedCapacity ?? ("NONE" as const),
    ricm: m.returnItemCollectionMetrics ?? ("NONE" as const),
  };
};

const buildUpdateParts = (u: UpdateShape | undefined) => {
  if (!u)
    return { UpdateExpression: "", Names: {} as Record<string, string>, Values: {} as Record<string, any> };
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
  const valuePH = (attr: string) => `:v_${attr.replace(/[^a-zA-Z0-9]/g, "_")}_${idx++}`;
  if (u.set) {
    for (const [k, v] of Object.entries(u.set)) {
      const n = namePH(k);
      const pv = valuePH(k);
      values[pv] = v;
      segSET.push(`${n} = ${pv}`);
    }
  }
  if (u.remove?.length) for (const k of u.remove) segREMOVE.push(namePH(k));
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

export async function writeItem<I extends Record<string, any>, K extends Record<string, any>>(
  doc: DynamoDBDocumentClient,
  opts: WriteItemOptions<I, K>
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

  const chosen: WriteMode = mode === "auto" ? (update ? "update" : "put") : mode;

  const { expr: existenceExpr, names: existenceNames } = buildExistenceCondition(key, existence);

  let lockExpr = "";
  const lockNames: Record<string, string> = {};
  const lockValues: Record<string, any> = {};
  if (optimisticLock) {
    lockNames["#__lock"] = optimisticLock.attribute;
    lockValues[":__expected"] = optimisticLock.expected;
    lockExpr = "#__lock = :__expected";
  }
  const combineConds = (...conds: string[]) => conds.filter(Boolean).join(" AND ") || undefined;

  try {
    if (chosen === "put") {
      let rv: PutCommandInput["ReturnValues"] = "NONE";
      if (returnValues === "ALL_OLD") rv = "ALL_OLD";
      else if (returnValues !== "NONE") {
        warnings.push(`PutCommand does not support ReturnValues="${returnValues}". Using "NONE".`);
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

      const res = await doc.send(
        new PutCommand({
          TableName: tableName,
          Item: finalItem,
          ConditionExpression: condition,
          ExpressionAttributeNames: condition ? { ...existenceNames, ...lockNames } : undefined,
          ExpressionAttributeValues: condition ? { ...lockValues } : undefined,
          ReturnValues: rv,
          ReturnConsumedCapacity: rcc,
          ReturnItemCollectionMetrics: ricm,
        })
      );

      return {
        ok: true,
        attributes: res.Attributes as any,
        consumedCapacity: res.ConsumedCapacity,
        itemCollectionMetrics: res.ItemCollectionMetrics,
        metadata: res.$metadata,
        warnings,
      };
    } else {
      const { UpdateExpression: uExpr0, Names: uNames0, Values: uValues0 } = buildUpdateParts(update);
      let uExpr = uExpr0;
      const names: Record<string, string> = { ...uNames0 };
      const values: Record<string, any> = { ...uValues0 };

      if (ts.enabled) {
        const now = ts.nowFactory();
        names["#__createdAt"] = ts.createdAtField;
        names["#__updatedAt"] = ts.updatedAtField;
        values[":__now"] = ts.numeric ? Number(now) : now;

        const tsSet = "#__createdAt = if_not_exists(#__createdAt, :__now), #__updatedAt = :__now";
        if (!uExpr) uExpr = `SET ${tsSet}`;
        else if (uExpr.startsWith("SET ")) uExpr = uExpr.replace(/^SET\s+/, `SET ${tsSet}, `);
        else uExpr = `SET ${tsSet} ${uExpr.startsWith("REMOVE") ? "" : ","} ${uExpr}`;
      }

      const condition = combineConds(existenceExpr, lockExpr);

      const res = await doc.send(
        new UpdateCommand({
          TableName: tableName,
          Key: key,
          UpdateExpression: uExpr || "SET #__noop = :__noop",
          ExpressionAttributeNames: {
            ...names,
            ...(condition ? { ...existenceNames, ...lockNames } : undefined),
            ...(uExpr and "#__noop" in uExpr and uExpr.find("#__noop") is not None and False) and { "#__noop": "__noop" } or {},
          },
          ExpressionAttributeValues: {
            ...values,
            ...(condition ? { ...lockValues } : undefined),
            ...(uExpr and ":__noop" in uExpr and False) and { ":__noop": 1 } or {},
          },
          ConditionExpression: condition,
          ReturnValues: (returnValues as UpdateCommandInput["ReturnValues"]) ?? "NONE",
          ReturnConsumedCapacity: rcc,
          ReturnItemCollectionMetrics: ricm,
        })
      );

      return {
        ok: true,
        attributes: res.Attributes as any,
        consumedCapacity: res.ConsumedCapacity,
        itemCollectionMetrics: res.ItemCollectionMetrics,
        metadata: res.$metadata,
        warnings,
      };
    }
  } catch (e: any) {
    const status =
      e?.name === "ConditionalCheckFailedException" ? 400 : e?.$metadata?.httpStatusCode ?? 500;
    return { ok: false, statusCode: status, error: e?.message ?? String(e), originalError: e };
  }
}
```

---

## Gotchas & Notes

- **Primary key immutability:** You cannot change partition/sort keys with `Update`. To “rename” keys, `Put` a new item and delete the old one.
- **`Put` ReturnValues:** only `NONE` and `ALL_OLD`. If you pass others, the helper downgrades to `NONE` and records a warning.
- **Upsert defaults:** `Update` without `existence` conditions will create missing items. Add `existence:"updateOnly"` to block creation.
- **Transactions:** To use inside a transaction, embed equivalent commands in `TransactWriteItems`. This helper targets single-item writes.
- **Size/Throughput:** Large attributes and repeated updates consume more capacity; use `metrics:true` periodically to profile.

---

## FAQ / Troubleshooting

**Q:** I’m seeing `ConditionalCheckFailedException`.
**A:** Your `existence` or `optimisticLock` condition failed. Check that the item exists (for `updateOnly`) and that your expected version matches.

**Q:** I passed `returnValues: "ALL_NEW"` with `mode:"put"` and got no attributes.
**A:** `Put` doesn’t support `ALL_NEW`. Use `Update` or change to `ALL_OLD`.

**Q:** How do I set `createdAt` only once but keep bumping `updatedAt`?
**A:** That’s the default Update behavior: `createdAt = if_not_exists(createdAt, now)`, `updatedAt = now`.

**Q:** Can I store both ISO and epoch?
**A:** Extend the helper to write both fields (e.g., `createdAt`, `createdAtMs`). Or set `numeric:true` globally.

**Q:** How do I update nested map paths or lists?
**A:** Use `UpdateShape.set` with attribute paths (e.g., "profile.name") or provide a `rawExpression` for advanced path expressions.
