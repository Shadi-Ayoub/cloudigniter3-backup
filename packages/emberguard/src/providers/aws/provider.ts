import type {
  CiResourceDefinition,
  CiResourceDomainDefinition,
} from "../../types";
import type {
  CiEmberguardAccessControlState,
  CiEmberguardCustomDomainRecord,
  CiEmberguardProvider,
  CiEmberguardRepository,
  CiEmberguardResourceInventoryRecord,
  CiEmberguardStoredRoleAssignment,
} from "../../types/provider-types";

export const CI_EMBERGUARD_AWS_ITEM_TYPES = {
  definition: "ACCESS_DEFINITION",
  domain: "ACCESS_DOMAIN",
  resource: "ACCESS_RESOURCE",
  inventory: "RESOURCE_INVENTORY",
  assignment: "ROLE_ASSIGNMENT",
  customDomain: "CUSTOM_DOMAIN",
} as const;

export type CiAwsEmberguardTableNames = {
  accessTableName: string;
};

export type CiAwsEmberguardTableKey = {
  PK: string;
  SK: string;
};

export type CiAwsEmberguardTableKeys = {
  accessControlDefinition: CiAwsEmberguardTableKey;
  roleAssignment(input: { id: string; subjectId: string; tenantId?: string }): {
    record: CiAwsEmberguardTableKey;
    collection: CiAwsEmberguardTableKey;
  };
  roleAssignmentsBySubject(subjectId: string): string;
  roleAssignmentsCollection: string;
  roleAssignmentsByTenant(tenantId: string): string;
};

export type CiAwsEmberguardDatabase = {
  initialize?(): Promise<unknown>;
  readItem(
    input: Record<string, unknown>,
  ): Promise<{ ok: boolean; body?: any }>;
  queryItems(
    input: Record<string, unknown>,
  ): Promise<{ ok: boolean; body?: any }>;
  writeItem(
    input: Record<string, unknown>,
  ): Promise<{ ok: boolean; body?: any }>;
  deleteItem(
    input: Record<string, unknown>,
  ): Promise<{ ok: boolean; body?: any }>;
  transactWrite(
    input: Record<string, unknown>,
  ): Promise<{ ok: boolean; body?: any }>;
};

export type CiAwsEmberguardProviderInput = {
  database: CiAwsEmberguardDatabase;
  tables: CiAwsEmberguardTableNames;
  keys: CiAwsEmberguardTableKeys;
};

type StoredItem<T extends Record<string, unknown>> = T & {
  PK: string;
  SK: string;
  type: string;
  GSI1PK?: string;
  GSI1SK?: string;
  tenantId?: string;
  updatedAt: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

/** Builds the optimistic condition shared by state and assignment mutations. */
function buildRevisionCondition(expectedRevision: number) {
  return {
    expression:
      expectedRevision === 0
        ? "attribute_not_exists(#state) OR #state.#revision = :expectedRevision"
        : "#state.#revision = :expectedRevision",
    names: { "#state": "state", "#revision": "revision" },
    values: { ":expectedRevision": expectedRevision },
  };
}

function unwrapItems<T extends Record<string, unknown>>(result: {
  ok: boolean;
  body?: { items?: T[] };
}): T[] {
  if (!result.ok) return [];
  return result.body?.items ?? [];
}

/** Returns a safe provider message without logging request data. */
function databaseErrorMessage(result: { body?: any }): string | undefined {
  const error = result.body?.error;
  const details = result.body?.details;
  if (typeof error === "string" && error.trim()) return error.trim();
  if (typeof details?.message === "string" && details.message.trim()) {
    return details.message.trim();
  }
  return undefined;
}

/** Returns true only for an optimistic-lock or transaction-contention failure. */
function isConcurrentWriteFailure(result: { body?: any }): boolean {
  const name = result.body?.details?.name;
  const message = databaseErrorMessage(result) ?? "";
  return (
    name === "ConditionalCheckFailedException" ||
    name === "TransactionConflictException" ||
    message.includes("ConditionalCheckFailed") ||
    message.toLowerCase().includes("transaction conflict")
  );
}

function removeStorageKeys<T extends Record<string, unknown>>(
  item: T,
): Omit<T, "PK" | "SK" | "GSI1PK" | "GSI1SK" | "type"> {
  const { PK, SK, GSI1PK, GSI1SK, type, ...record } = item;
  void PK;
  void SK;
  void GSI1PK;
  void GSI1SK;
  void type;
  return record;
}

export function ciCreateAwsEmberguardProvider(
  input: CiAwsEmberguardProviderInput,
): CiEmberguardProvider {
  const { database, keys, tables } = input;

  async function putItem<T extends Record<string, unknown>>(
    item: StoredItem<T>,
  ): Promise<void> {
    await database.initialize?.();
    const result = await database.writeItem({
      tableName: tables.accessTableName,
      key: {
        PK: item.PK,
        SK: item.SK,
      },
      item,
      mode: "put",
    });
    if (!result.ok) {
      throw new Error("Failed to write Emberguard AWS repository item.");
    }
  }

  async function query<T extends Record<string, unknown>>(
    expression: Record<string, unknown>,
  ): Promise<T[]> {
    await database.initialize?.();
    const items: T[] = [];
    let exclusiveStartKey: Record<string, unknown> | undefined;
    do {
      const result = await database.queryItems({
        TableName: tables.accessTableName,
        ...expression,
        ExclusiveStartKey: exclusiveStartKey,
        ReturnConsumedCapacity: "TOTAL",
      });
      if (!result.ok) {
        const detail = databaseErrorMessage(result);
        throw new Error(
          `Failed to query Emberguard AWS repository items${
            detail ? `: ${detail}` : "."
          }`,
        );
      }
      items.push(...unwrapItems<T>(result));
      exclusiveStartKey = result.body?.lastEvaluatedKey;
    } while (exclusiveStartKey);
    return items;
  }

  const repository: CiEmberguardRepository = {
    async getAccessControlState() {
      await database.initialize?.();
      const result = await database.readItem({
        tableName: tables.accessTableName,
        key: keys.accessControlDefinition,
        consistent: true,
      });

      return result.ok
        ? ((result.body?.item?.state as
            CiEmberguardAccessControlState | undefined) ?? null)
        : null;
    },

    async initializeAccessControlState(state) {
      await database.initialize?.();
      const result = await database.writeItem({
        tableName: tables.accessTableName,
        mode: "put",
        key: keys.accessControlDefinition,
        item: {
          ...keys.accessControlDefinition,
          type: CI_EMBERGUARD_AWS_ITEM_TYPES.definition,
          state,
          updatedAt: nowIso(),
        },
        existence: "insertOnly",
        metrics: { returnConsumedCapacity: "TOTAL" },
      });
      if (result.ok) {
        return { state, created: true };
      }

      // A concurrent initializer may have won the conditional write. Read its
      // value instead of replacing it with this caller's defaults.
      const existing = await repository.getAccessControlState();
      if (existing) {
        return { state: existing, created: false };
      }

      throw new Error("Failed to initialize the access-control state.");
    },

    async saveAccessControlState(state, expectedRevision) {
      await database.initialize?.();
      const result = await database.transactWrite({
        tableName: tables.accessTableName,
        items: [
          {
            mode: "put",
            key: keys.accessControlDefinition,
            item: {
              ...keys.accessControlDefinition,
              type: CI_EMBERGUARD_AWS_ITEM_TYPES.definition,
              state,
              updatedAt: nowIso(),
            },
            condition: buildRevisionCondition(expectedRevision),
          },
        ],
        returnConsumedCapacity: "TOTAL",
      });
      if (!result.ok) {
        const concurrent = isConcurrentWriteFailure(result);
        const current = await repository.getAccessControlState();
        if (
          concurrent &&
          current &&
          JSON.stringify(current.definition) === JSON.stringify(state.definition)
        ) {
          return;
        }
        if (!concurrent) {
          const detail = databaseErrorMessage(result);
          throw new Error(
            `Failed to save the access-control state${
              detail ? `: ${detail}` : "."
            }`,
          );
        }
        throw new Error(
          "The access-control state changed concurrently; retry the mutation.",
        );
      }
    },

    async listResourceDomains() {
      const items = await query<StoredItem<CiResourceDomainDefinition>>({
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": "CATALOG#DOMAINS",
        },
      });
      return items.map((item) => removeStorageKeys(item));
    },

    putResourceDomain(domain) {
      return putItem({
        ...domain,
        PK: "CATALOG#DOMAINS",
        SK: `DOMAIN#${domain.id}`,
        type: CI_EMBERGUARD_AWS_ITEM_TYPES.domain,
        updatedAt: nowIso(),
      });
    },

    async listResources(input) {
      const expression = input?.domainId
        ? {
            IndexName: "GSI1",
            KeyConditionExpression: "GSI1PK = :pk",
            ExpressionAttributeValues: {
              ":pk": `CATALOG#RESOURCES#DOMAIN#${input.domainId}`,
            },
          }
        : {
            KeyConditionExpression: "PK = :pk",
            ExpressionAttributeValues: { ":pk": "CATALOG#RESOURCES" },
          };
      const items = await query<StoredItem<CiResourceDefinition>>({
        ...expression,
      });
      return items.map((item) => removeStorageKeys(item));
    },

    putResource(resource) {
      return putItem({
        ...resource,
        PK: "CATALOG#RESOURCES",
        SK: `RESOURCE#${resource.id}`,
        GSI1PK: `CATALOG#RESOURCES#DOMAIN#${resource.domainId}`,
        GSI1SK: `RESOURCE#${resource.id}`,
        type: CI_EMBERGUARD_AWS_ITEM_TYPES.resource,
        updatedAt: nowIso(),
      });
    },

    async listResourceInventory(input) {
      const pk = input?.tenantId
        ? `TENANT#${input.tenantId}#RESOURCE_INVENTORY`
        : "GLOBAL#RESOURCE_INVENTORY";
      const items = await query<
        StoredItem<CiEmberguardResourceInventoryRecord>
      >({
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": pk },
      });
      return items
        .map((item) => removeStorageKeys(item))
        .filter((item) => !input?.domainId || item.domainId === input.domainId);
    },

    putResourceInventoryRecord(record) {
      const pk = record.tenantId
        ? `TENANT#${record.tenantId}#RESOURCE_INVENTORY`
        : "GLOBAL#RESOURCE_INVENTORY";
      return putItem({
        ...record,
        PK: pk,
        SK: `RESOURCE#${record.id}`,
        type: CI_EMBERGUARD_AWS_ITEM_TYPES.inventory,
        provider: record.provider ?? "aws",
        updatedAt: nowIso(),
      });
    },

    async listRoleAssignments(input) {
      const expression = input.subjectId
        ? {
            KeyConditionExpression: "PK = :pk",
            ExpressionAttributeValues: {
              ":pk": keys.roleAssignmentsBySubject(input.subjectId),
            },
            ConsistentRead: true,
          }
        : {
            KeyConditionExpression: input.tenantId
              ? "PK = :pk AND begins_with(SK, :tenant)"
              : "PK = :pk",
            ExpressionAttributeValues: input.tenantId
              ? {
                  ":pk": keys.roleAssignmentsCollection,
                  ":tenant": keys.roleAssignmentsByTenant(input.tenantId),
                }
              : { ":pk": keys.roleAssignmentsCollection },
            ConsistentRead: true,
          };
      const items = await query<StoredItem<CiEmberguardStoredRoleAssignment>>({
        ...expression,
      });
      return items
        .map((item) => removeStorageKeys(item))
        .filter((item) => !input.tenantId || item.tenantId === input.tenantId);
    },

    async putRoleAssignmentWithAccessControlState(
      assignment,
      state,
      expectedRevision,
      previousAssignment,
    ) {
      await database.initialize?.();
      const assignmentKeys = keys.roleAssignment(assignment);
      const updatedAt = nowIso();
      const previousKeys =
        previousAssignment &&
        (previousAssignment.subjectId !== assignment.subjectId ||
          previousAssignment.tenantId !== assignment.tenantId)
          ? keys.roleAssignment(previousAssignment)
          : undefined;
      const result = await database.transactWrite({
        tableName: tables.accessTableName,
        items: [
          ...(previousKeys
            ? [
                ...(previousAssignment?.subjectId !== assignment.subjectId
                  ? [
                      {
                        mode: "delete" as const,
                        key: previousKeys.record,
                      },
                    ]
                  : []),
                {
                  mode: "delete" as const,
                  key: previousKeys.collection,
                },
              ]
            : []),
          {
            mode: "put",
            key: assignmentKeys.record,
            item: {
              ...assignment,
              ...assignmentKeys.record,
              type: CI_EMBERGUARD_AWS_ITEM_TYPES.assignment,
              updatedAt,
            },
          },
          {
            mode: "put",
            key: assignmentKeys.collection,
            item: {
              ...assignment,
              ...assignmentKeys.collection,
              type: CI_EMBERGUARD_AWS_ITEM_TYPES.assignment,
              projection: "ROLE_ASSIGNMENT_COLLECTION",
              updatedAt,
            },
          },
          {
            mode: "put",
            key: keys.accessControlDefinition,
            item: {
              ...keys.accessControlDefinition,
              type: CI_EMBERGUARD_AWS_ITEM_TYPES.definition,
              state,
              updatedAt,
            },
            condition: buildRevisionCondition(expectedRevision),
          },
        ],
        returnConsumedCapacity: "TOTAL",
      });
      if (!result.ok) {
        throw new Error(
          "Failed to atomically write the role assignment and role counters.",
        );
      }
    },

    async deleteRoleAssignmentWithAccessControlState(
      input,
      state,
      expectedRevision,
    ) {
      await database.initialize?.();
      const assignmentKeys = keys.roleAssignment(input);
      const updatedAt = nowIso();
      const result = await database.transactWrite({
        tableName: tables.accessTableName,
        items: [
          {
            mode: "delete",
            key: assignmentKeys.record,
          },
          {
            mode: "delete",
            key: assignmentKeys.collection,
          },
          {
            mode: "put",
            key: keys.accessControlDefinition,
            item: {
              ...keys.accessControlDefinition,
              type: CI_EMBERGUARD_AWS_ITEM_TYPES.definition,
              state,
              updatedAt,
            },
            condition: buildRevisionCondition(expectedRevision),
          },
        ],
        returnConsumedCapacity: "TOTAL",
      });
      if (!result.ok) {
        throw new Error(
          "Failed to atomically delete the role assignment and update role counters.",
        );
      }
    },

    async listCustomDomains(input) {
      const pk = input?.tenantId
        ? `TENANT#${input.tenantId}#CUSTOM_DOMAINS`
        : "GLOBAL#CUSTOM_DOMAINS";
      const items = await query<StoredItem<CiEmberguardCustomDomainRecord>>({
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": pk },
      });
      return items.map((item) => removeStorageKeys(item));
    },

    putCustomDomain(record) {
      const pk = record.tenantId
        ? `TENANT#${record.tenantId}#CUSTOM_DOMAINS`
        : "GLOBAL#CUSTOM_DOMAINS";
      return putItem({
        ...record,
        PK: pk,
        SK: `DOMAIN#${record.id}`,
        type: CI_EMBERGUARD_AWS_ITEM_TYPES.customDomain,
        updatedAt: nowIso(),
      });
    },

    async deleteCustomDomain(input) {
      await database.initialize?.();
      const pk = input.tenantId
        ? `TENANT#${input.tenantId}#CUSTOM_DOMAINS`
        : "GLOBAL#CUSTOM_DOMAINS";
      const result = await database.deleteItem({
        tableName: tables.accessTableName,
        key: {
          PK: pk,
          SK: `DOMAIN#${input.id}`,
        },
      });
      if (!result.ok)
        throw new Error("Failed to delete Emberguard custom domain.");
    },
  };

  return {
    name: "aws",
    repository,
  };
}
