import {
  GetCommand,
  PutCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  ciBuildTableKeys,
  ciParseSettingsTarget,
} from "@cloudigniter/core/lib";
import type {
  CiSettings,
  CiSettingsRecord,
  CiSettingsStore,
  CiSettingsStoreGetInput,
  CiSettingsStoreSetInput,
  CiSettingsStoreCondition,
} from "@cloudigniter/core/types";
import type { CiAwsSettingsStoreOptions } from "@ci-aws/types";

/** Exact group lookup; no scans, GSIs, owner listing, or cross-category table access. */
export function ciSettingsRecordKey(input: CiSettingsStoreGetInput) {
  const target = ciParseSettingsTarget({
    scope: input.targetTenantScope,
    ...(input.tenantId ? { tenantId: input.tenantId } : {}),
  });
  if (input.scope === "user" && target.scope !== "system")
    throw new Error("Personal settings are account-wide.");
  if (input.scope === "user" && !input.userId)
    throw new Error("Personal settings require an owner.");
  return ciBuildTableKeys({
    partition:
      input.scope === "user"
        ? ["SETTINGS", "USER", input.userId!]
        : target.scope === "tenant"
          ? ["SETTINGS", "TENANT", target.tenantId, input.scope.toUpperCase()]
          : ["SETTINGS", target.scope.toUpperCase(), input.scope.toUpperCase()],
    sort: ["GROUP", input.settingsId],
  });
}

export function ciCreateAwsSettingsStore({
  client,
  tables,
}: CiAwsSettingsStoreOptions): CiSettingsStore {
  function table(scope: keyof typeof tables) {
    if (!tables[scope])
      throw new Error("Settings storage is not deployed for this category.");
    return tables[scope];
  }
  function prepareWrite<T extends CiSettings>(
    input: CiSettingsStoreSetInput<T>,
  ) {
    const expected = input.expectedRevision;
    if (
      expected === undefined ||
      !Number.isSafeInteger(expected) ||
      expected < 0
    )
      throw new Error("Settings writes require an expected revision.");
    const record: CiSettingsRecord<T> = {
      settingsId: input.settingsId,
      scope: input.scope,
      targetTenantScope: input.targetTenantScope,
      ...(input.userId ? { userId: input.userId } : {}),
      ...(input.tenantId ? { tenantId: input.tenantId } : {}),
      ...(input.enforcement ? { enforcement: input.enforcement } : {}),
      value: input.value,
      revision: expected + 1,
      updatedAt: new Date().toISOString(),
    };
    return {
      record,
      put: {
        TableName: table(input.scope),
        Item: { ...ciSettingsRecordKey(input), ...record },
        ConditionExpression:
          expected === 0 ? "attribute_not_exists(PK)" : "#revision = :expected",
        ...(expected === 0
          ? {}
          : {
              ExpressionAttributeNames: { "#revision": "revision" },
              ExpressionAttributeValues: { ":expected": expected },
            }),
      },
    };
  }
  function condition(input: CiSettingsStoreCondition) {
    if (!Number.isSafeInteger(input.revision) || input.revision < 0)
      throw new Error("Invalid source settings revision.");
    return {
      TableName: table(input.scope),
      Key: ciSettingsRecordKey(input),
      ConditionExpression:
        input.revision === 0
          ? "attribute_not_exists(PK)"
          : "#revision = :expected",
      ...(input.revision === 0
        ? {}
        : {
            ExpressionAttributeNames: { "#revision": "revision" },
            ExpressionAttributeValues: { ":expected": input.revision },
          }),
    };
  }
  const store: CiSettingsStore = {
    async initialize(input, source) {
      const { record, put } = prepareWrite({ ...input, expectedRevision: 0 });
      try {
        await client.send(
          new TransactWriteCommand({
            TransactItems: [
              { ConditionCheck: condition(source) },
              { Put: put },
            ],
            ReturnConsumedCapacity: "TOTAL",
          }),
        );
        return record;
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "TransactionCanceledException" &&
          "CancellationReasons" in error &&
          Array.isArray(error.CancellationReasons) &&
          error.CancellationReasons.some(
            (reason) => reason?.Code === "ConditionalCheckFailed",
          )
        ) {
          const winner = await store.get(input);
          if (winner) return winner;
          throw Object.assign(
            new Error(
              "System settings changed while creating the tenant copy.",
            ),
            { name: "SettingsSnapshotConflict" },
          );
        }
        throw error;
      }
    },
    async setMany(inputs, conditions = []) {
      if (!inputs.length || inputs.length + conditions.length > 100)
        throw new Error(
          "A settings transaction supports 100 actions: up to 100 System groups or 50 tenant groups.",
        );
      const first = inputs[0]!;
      if (
        inputs.some(
          (input) =>
            input.scope !== first.scope ||
            input.userId !== first.userId ||
            input.targetTenantScope !== first.targetTenantScope ||
            input.tenantId !== first.tenantId,
        )
      )
        throw new Error("Save one settings category and owner at a time.");
      const writes = inputs.map(prepareWrite);
      if (
        new Set(
          writes.map(({ put }) =>
            JSON.stringify([put.TableName, put.Item.PK, put.Item.SK]),
          ),
        ).size !== writes.length
      )
        throw new Error("Duplicate settings group.");
      try {
        await client.send(
          new TransactWriteCommand({
            TransactItems: [
              ...conditions.map((input) => ({
                ConditionCheck: condition(input),
              })),
              ...writes.map(({ put }) => ({ Put: put })),
            ],
            ReturnConsumedCapacity: "TOTAL",
          }),
        );
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "TransactionCanceledException"
        ) {
          const reasons =
            "CancellationReasons" in error
              ? error.CancellationReasons
              : undefined;
          if (
            Array.isArray(reasons) &&
            reasons.some((reason) => reason?.Code === "ConditionalCheckFailed")
          )
            throw new Error(
              "These settings changed since you opened them. Reload before saving. No sections were saved.",
            );
          throw new Error(
            "Unable to save settings. No sections were saved. Please try again.",
          );
        }
        throw error;
      }
      return writes.map(({ record }) => record);
    },
    async get<T extends CiSettings>(input: CiSettingsStoreGetInput) {
      const result = await client.send(
        new GetCommand({
          TableName: table(input.scope),
          Key: ciSettingsRecordKey(input),
          ConsistentRead: true,
        }),
      );
      if (!result.Item) return null;
      if (
        !result.Item.value ||
        typeof result.Item.value !== "object" ||
        !Number.isSafeInteger(result.Item.revision)
      )
        throw new Error("Invalid persisted settings record.");
      return {
        ...input,
        value: result.Item.value,
        revision: result.Item.revision,
        updatedAt: result.Item.updatedAt,
        ...(result.Item.enforcement !== undefined
          ? { enforcement: result.Item.enforcement }
          : {}),
      } as CiSettingsRecord<T>;
    },
    async set<T extends CiSettings>(
      input: CiSettingsStoreGetInput & {
        value: Partial<T>;
        expectedRevision?: number;
      },
    ) {
      const { record, put } = prepareWrite(input);
      try {
        await client.send(
          new PutCommand({ ...put, ReturnConsumedCapacity: "TOTAL" }),
        );
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "ConditionalCheckFailedException"
        )
          throw new Error(
            "These settings changed since you opened them. Reload before saving.",
          );
        throw error;
      }
      return record;
    },
    async delete() {
      throw new Error(
        "Settings deletion is not supported. Save the configured defaults instead.",
      );
    },
  };
  return store;
}
