import type {
  CiAccessControlDefinition,
  CiResourceDefinition,
  CiResourceDomainDefinition,
} from "../../types";
import type {
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

export type CiAwsEmberguardDatabase = {
  initialize?(): Promise<unknown>;
  readItem(input: Record<string, unknown>): Promise<{ ok: boolean; body?: any }>;
  queryItems(input: Record<string, unknown>): Promise<{ ok: boolean; body?: any }>;
  writeItem(input: Record<string, unknown>): Promise<{ ok: boolean; body?: any }>;
  deleteItem(input: Record<string, unknown>): Promise<{ ok: boolean; body?: any }>;
};

export type CiAwsEmberguardProviderInput = {
  database: CiAwsEmberguardDatabase;
  tables: CiAwsEmberguardTableNames;
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

const DEFINITION_KEY = { PK: "CONFIG#ACCESS_CONTROL", SK: "DEFINITION#ACTIVE" } as const;

function nowIso(): string {
  return new Date().toISOString();
}

function unwrapItems<T extends Record<string, unknown>>(
  result: { ok: boolean; body?: { items?: T[] } },
): T[] {
  if (!result.ok) return [];
  return result.body?.items ?? [];
}

function removeStorageKeys<T extends Record<string, unknown>>(item: T): Omit<T, "PK" | "SK" | "GSI1PK" | "GSI1SK" | "type"> {
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
  const { database, tables } = input;

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
    return unwrapItems<T>(
      await database.queryItems({
        TableName: tables.accessTableName,
        ...expression,
      }),
    );
  }

  const repository: CiEmberguardRepository = {
    async getAccessControlDefinition() {
      await database.initialize?.();
      const result = await database.readItem({
        tableName: tables.accessTableName,
        key: DEFINITION_KEY,
        consistent: true,
      });

      return result.ok
        ? (result.body?.item?.definition as CiAccessControlDefinition | undefined) ?? null
        : null;
    },

    saveAccessControlDefinition(definition) {
      return putItem({
        ...DEFINITION_KEY,
        type: CI_EMBERGUARD_AWS_ITEM_TYPES.definition,
        definition,
        updatedAt: nowIso(),
      });
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
      const items = await query<StoredItem<CiEmberguardResourceInventoryRecord>>({
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
              ":pk": `SUBJECT#${input.subjectId}#ROLE_ASSIGNMENTS`,
            },
          }
        : {
            IndexName: "GSI1",
            KeyConditionExpression: "GSI1PK = :pk",
            ExpressionAttributeValues: {
              ":pk": `TENANT#${input.tenantId ?? "global"}#ROLE_ASSIGNMENTS`,
            },
          };
      const items = await query<StoredItem<CiEmberguardStoredRoleAssignment>>({
        ...expression,
      });
      return items
        .map((item) => removeStorageKeys(item))
        .filter((item) => !input.tenantId || item.tenantId === input.tenantId);
    },

    putRoleAssignment(assignment) {
      return putItem({
        ...assignment,
        PK: `SUBJECT#${assignment.subjectId}#ROLE_ASSIGNMENTS`,
        SK: `ASSIGNMENT#${assignment.id}`,
        GSI1PK: `TENANT#${assignment.tenantId ?? "global"}#ROLE_ASSIGNMENTS`,
        GSI1SK: `SUBJECT#${assignment.subjectId}#ASSIGNMENT#${assignment.id}`,
        type: CI_EMBERGUARD_AWS_ITEM_TYPES.assignment,
        updatedAt: nowIso(),
      });
    },

    async deleteRoleAssignment(input) {
      await database.initialize?.();
      const result = await database.deleteItem({
        tableName: tables.accessTableName,
        key: {
          PK: `SUBJECT#${input.subjectId}#ROLE_ASSIGNMENTS`,
          SK: `ASSIGNMENT#${input.id}`,
        },
      });
      if (!result.ok) throw new Error("Failed to delete Emberguard role assignment.");
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
      if (!result.ok) throw new Error("Failed to delete Emberguard custom domain.");
    },
  };

  return {
    name: "aws",
    repository,
  };
}
