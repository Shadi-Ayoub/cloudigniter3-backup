import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchGetCommand,
  DynamoDBDocumentClient,
  GetCommand,
  TransactWriteCommand,
  type TransactWriteCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { ciResponseError, ciResponseOk } from "@cloudigniter/core/lib";
import type {
  CiOrgUnitMutationResult,
  CiOrgUnitStatus,
  CiResponse,
  CiUpdateOrgUnitInput,
} from "@cloudigniter/core/types";
import { ciBuildTenantPrimaryKey } from "../tenant/ci-tenant-record";
import {
  ciBuildOrgUnitChildrenPartitionKey,
  ciBuildOrgUnitCollectionSortKey,
  ciBuildOrgUnitPrimaryKey,
  ciBuildOrgUnitTenantAttachmentKeys,
  ciBuildStoredOrgUnitAttachment,
  ciOrgUnitToManagementRow,
  ciRequireOrgUnitTenantIds,
  ciRequireOrgUnitText,
  type CiStoredOrgUnit,
} from "./ci-org-unit-record";

export type CiUpdateOrgUnitServiceInput = CiUpdateOrgUnitInput & {
  actorId: string;
  now: string;
};

type RootChanges = {
  name: string;
  description?: string;
  status: CiOrgUnitStatus;
  tenantIds: string[];
};

const MAX_MOVE_SUBTREE_NODES = 100;

async function batchGetOrgUnits(
  client: DynamoDBDocumentClient,
  tableName: string,
  ids: readonly string[],
): Promise<CiStoredOrgUnit[]> {
  if (ids.length === 0) return [];
  const items: CiStoredOrgUnit[] = [];
  const uniqueIds = [...new Set(ids)];
  for (let start = 0; start < uniqueIds.length; start += 100) {
    let pendingKeys: Record<string, unknown>[] = uniqueIds
      .slice(start, start + 100)
      .map(ciBuildOrgUnitPrimaryKey);
    for (let attempt = 0; pendingKeys.length > 0 && attempt < 3; attempt += 1) {
      const response = await client.send(
        new BatchGetCommand({
          RequestItems: {
            [tableName]: { Keys: pendingKeys, ConsistentRead: true },
          },
        }),
      );
      items.push(
        ...((response.Responses?.[tableName] ?? []) as CiStoredOrgUnit[]),
      );
      pendingKeys = response.UnprocessedKeys?.[tableName]?.Keys ?? [];
    }
    if (pendingKeys.length > 0) {
      throw new Error(
        "The Org Unit subtree could not be verified. Retry the update.",
      );
    }
  }
  return items;
}

async function getOrgUnit(
  client: DynamoDBDocumentClient,
  tableName: string,
  orgUnitId: string,
): Promise<CiStoredOrgUnit | undefined> {
  const response = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: ciBuildOrgUnitPrimaryKey(orgUnitId),
      ConsistentRead: true,
    }),
  );
  return response.Item as CiStoredOrgUnit | undefined;
}

async function loadSubtree(
  client: DynamoDBDocumentClient,
  tableName: string,
  root: CiStoredOrgUnit,
): Promise<CiStoredOrgUnit[]> {
  const result = [root];
  const seen = new Set([root.id]);
  let pending = (root.data.childIds ?? []).map((id) => ({
    id,
    expectedParentId: root.id,
  }));
  while (pending.length > 0) {
    if (seen.size + pending.length > MAX_MOVE_SUBTREE_NODES) {
      throw new Error(
        `Moving a subtree with more than ${MAX_MOVE_SUBTREE_NODES} Org Units is not supported.`,
      );
    }
    const pendingIds = pending.map(({ id }) => id);
    if (
      new Set(pendingIds).size !== pendingIds.length ||
      pendingIds.some((id) => seen.has(id))
    ) {
      throw new Error(
        "The Org Unit subtree contains a cycle or repeated child.",
      );
    }
    const level = await batchGetOrgUnits(client, tableName, pendingIds);
    const byId = new Map(level.map((row) => [row.id, row]));
    const missing = pendingIds.find((id) => !byId.has(id));
    if (missing) {
      throw new Error(`Descendant Org Unit "${missing}" was not found.`);
    }
    const next: typeof pending = [];
    for (const item of pending) {
      const row = byId.get(item.id)!;
      if (row.data.parentId !== item.expectedParentId) {
        throw new Error(
          `Descendant Org Unit "${row.id}" has an invalid parent reference.`,
        );
      }
      seen.add(row.id);
      result.push(row);
      next.push(
        ...(row.data.childIds ?? []).map((id) => ({
          id,
          expectedParentId: row.id,
        })),
      );
    }
    pending = next;
  }
  return result;
}

/** Pure subtree rewrite used by the transactional mover and focused tests. */
export function ciBuildMovedOrgUnitSubtree(input: {
  subtree: readonly CiStoredOrgUnit[];
  newParent: CiStoredOrgUnit | null;
  changes: RootChanges;
  now: string;
}): CiStoredOrgUnit[] {
  const current = input.subtree[0];
  if (!current) throw new Error("The Org Unit subtree is empty.");
  const parentPath = input.newParent?.data.path ?? "";
  const rootPath = `${parentPath}/${current.data.slug}`;
  const rootAncestors = input.newParent
    ? [...input.newParent.data.ancestorOrgUnitIds, input.newParent.id]
    : [];

  return input.subtree.map((row, index) => {
    const suffix = row.data.path.slice(current.data.path.length);
    const path = `${rootPath}${suffix}`;
    const currentAncestorIndex = row.data.ancestorOrgUnitIds.indexOf(
      current.id,
    );
    if (index > 0 && currentAncestorIndex < 0) {
      throw new Error(
        `Descendant Org Unit "${row.id}" has an invalid predecessor chain.`,
      );
    }
    const relativeAncestors =
      index === 0
        ? []
        : row.data.ancestorOrgUnitIds.slice(currentAncestorIndex + 1);
    const ancestorOrgUnitIds =
      index === 0
        ? rootAncestors
        : [...rootAncestors, current.id, ...relativeAncestors];
    const parentId =
      index === 0 ? (input.newParent?.id ?? null) : row.data.parentId;
    const next: CiStoredOrgUnit = {
      ...row,
      GSI1SK: ciBuildOrgUnitCollectionSortKey(path, row.id),
      GSI2PK: ciBuildOrgUnitChildrenPartitionKey(parentId),
      GSI2SK: ciBuildOrgUnitCollectionSortKey(path, row.id),
      name: index === 0 ? input.changes.name : row.name,
      status: index === 0 ? input.changes.status : row.status,
      data: {
        ...row.data,
        path,
        parentId,
        ancestorOrgUnitIds,
        tenantIds: index === 0 ? input.changes.tenantIds : row.data.tenantIds,
      },
      updatedAt: input.now,
      version: row.version + 1,
    };
    if (index === 0) {
      if (input.changes.description)
        next.description = input.changes.description;
      else delete next.description;
    }
    return next;
  });
}

function tenantChecks(
  tableName: string,
  tenantIds: readonly string[],
): NonNullable<TransactWriteCommandInput["TransactItems"]> {
  return tenantIds.map((tenantId) => ({
    ConditionCheck: {
      TableName: tableName,
      Key: ciBuildTenantPrimaryKey(tenantId),
      ConditionExpression:
        "attribute_exists(PK) AND (attribute_not_exists(deletionState) OR deletionState = :active)",
      ExpressionAttributeValues: { ":active": "active" },
    },
  }));
}

function parentUpdate(
  tableName: string,
  parent: CiStoredOrgUnit,
  childIds: string[],
  now: string,
): NonNullable<TransactWriteCommandInput["TransactItems"]>[number] {
  return {
    Update: {
      TableName: tableName,
      Key: ciBuildOrgUnitPrimaryKey(parent.id),
      ConditionExpression: "version = :parentVersion",
      UpdateExpression:
        "SET #data.#childIds = :childIds, updatedAt = :now, version = version + :one",
      ExpressionAttributeNames: { "#data": "data", "#childIds": "childIds" },
      ExpressionAttributeValues: {
        ":parentVersion": parent.version,
        ":childIds": childIds,
        ":now": now,
        ":one": 1,
      },
    },
  };
}

async function moveSubtree(input: {
  client: DynamoDBDocumentClient;
  tableName: string;
  subtree: readonly CiStoredOrgUnit[];
  oldParent: CiStoredOrgUnit | null;
  newParent: CiStoredOrgUnit | null;
  changes: RootChanges;
  expectedVersion: number;
  now: string;
}): Promise<CiStoredOrgUnit> {
  const current = input.subtree[0]!;
  if (
    input.newParent &&
    input.subtree.some((row) => row.id === input.newParent?.id)
  ) {
    throw new Error(
      "An Org Unit cannot be moved below itself or one of its descendants.",
    );
  }
  const invalidTenant = input.changes.tenantIds.find(
    (tenantId) =>
      input.newParent && !input.newParent.data.tenantIds.includes(tenantId),
  );
  if (invalidTenant) {
    throw new Error(
      `Tenant "${invalidTenant}" is not attached to the requested parent Org Unit.`,
    );
  }

  const moved = ciBuildMovedOrgUnitSubtree({
    subtree: input.subtree,
    newParent: input.newParent,
    changes: input.changes,
    now: input.now,
  });
  const items: NonNullable<TransactWriteCommandInput["TransactItems"]> = [
    ...tenantChecks(input.tableName, input.changes.tenantIds),
  ];

  for (let index = 0; index < moved.length; index += 1) {
    const before = input.subtree[index]!;
    const after = moved[index]!;
    items.push({
      Put: {
        TableName: input.tableName,
        Item: after,
        ConditionExpression: "version = :expectedVersion",
        ExpressionAttributeValues: {
          ":expectedVersion":
            index === 0 ? input.expectedVersion : before.version,
        },
      },
    });
    for (const tenantId of before.data.tenantIds) {
      items.push({
        Delete: {
          TableName: input.tableName,
          Key: ciBuildOrgUnitTenantAttachmentKeys(tenantId, before.data.path),
          ConditionExpression: "#data.#orgUnitId = :orgUnitId",
          ExpressionAttributeNames: {
            "#data": "data",
            "#orgUnitId": "orgUnitId",
          },
          ExpressionAttributeValues: { ":orgUnitId": before.id },
        },
      });
    }
    for (const tenantId of after.data.tenantIds) {
      items.push({
        Put: {
          TableName: input.tableName,
          Item: ciBuildStoredOrgUnitAttachment(after, tenantId),
          ConditionExpression:
            "attribute_not_exists(PK) AND attribute_not_exists(SK)",
        },
      });
    }
  }

  if (input.oldParent) {
    items.push(
      parentUpdate(
        input.tableName,
        input.oldParent,
        (input.oldParent.data.childIds ?? []).filter((id) => id !== current.id),
        input.now,
      ),
    );
  }
  if (input.newParent) {
    items.push(
      parentUpdate(
        input.tableName,
        input.newParent,
        [...new Set([...(input.newParent.data.childIds ?? []), current.id])],
        input.now,
      ),
    );
  }
  if (items.length > 100) {
    throw new Error(
      `Moving this subtree requires ${items.length} atomic operations; the supported limit is 100.`,
    );
  }
  await input.client.send(new TransactWriteCommand({ TransactItems: items }));
  return moved[0]!;
}

export async function ciUpdateOrgUnit(args: {
  tableName: string;
  clientConfig: DynamoDBClientConfig;
  input: CiUpdateOrgUnitServiceInput;
}): Promise<CiResponse<CiOrgUnitMutationResult>> {
  try {
    const orgUnitId = ciRequireOrgUnitText(args.input.orgUnitId, "Org Unit ID");
    const name = ciRequireOrgUnitText(args.input.name, "Org Unit name");
    const tenantIds = ciRequireOrgUnitTenantIds(args.input.tenantIds);
    if (
      !("active suspended archived".split(" ") as string[]).includes(
        args.input.status,
      )
    ) {
      throw new Error("Org Unit status is invalid.");
    }
    const description = args.input.description?.trim();
    const client = DynamoDBDocumentClient.from(
      new DynamoDBClient(args.clientConfig),
      {
        marshallOptions: { removeUndefinedValues: true },
      },
    );
    const current = await getOrgUnit(client, args.tableName, orgUnitId);
    if (!current) throw new Error(`Org Unit "${orgUnitId}" was not found.`);
    if (current.version !== args.input.expectedVersion) {
      throw new Error(
        "The Org Unit changed after it was loaded. Refresh and try again.",
      );
    }

    const requestedParentId =
      args.input.parentId === undefined
        ? current.data.parentId
        : args.input.parentId?.trim() || null;
    const moving = requestedParentId !== current.data.parentId;
    const oldParent = current.data.parentId
      ? await getOrgUnit(client, args.tableName, current.data.parentId)
      : undefined;
    if (current.data.parentId && !oldParent) {
      throw new Error("The Org Unit parent no longer exists.");
    }
    const newParent = requestedParentId
      ? requestedParentId === oldParent?.id
        ? oldParent
        : await getOrgUnit(client, args.tableName, requestedParentId)
      : undefined;
    if (requestedParentId && !newParent) {
      throw new Error(`Parent Org Unit "${requestedParentId}" was not found.`);
    }
    const invalidTenant = tenantIds.find(
      (tenantId) => newParent && !newParent.data.tenantIds.includes(tenantId),
    );
    if (invalidTenant) {
      throw new Error(
        `Tenant "${invalidTenant}" is not attached to predecessor Org Unit "${newParent?.id}".`,
      );
    }

    const children = await batchGetOrgUnits(
      client,
      args.tableName,
      current.data.childIds ?? [],
    );
    for (const child of children) {
      const missingTenant = child.data.tenantIds.find(
        (tenantId) => !tenantIds.includes(tenantId),
      );
      if (missingTenant) {
        throw new Error(
          `Tenant "${missingTenant}" cannot be detached while child Org Unit "${child.name}" still uses it.`,
        );
      }
    }
    const changes: RootChanges = {
      name,
      description,
      status: args.input.status,
      tenantIds,
    };

    if (moving) {
      const subtree = await loadSubtree(client, args.tableName, current);
      const movedRoot = await moveSubtree({
        client,
        tableName: args.tableName,
        subtree,
        oldParent: oldParent ?? null,
        newParent: newParent ?? null,
        changes,
        expectedVersion: args.input.expectedVersion,
        now: args.input.now,
      });
      return ciResponseOk({ orgUnit: ciOrgUnitToManagementRow(movedRoot) });
    }

    const next: CiStoredOrgUnit = {
      ...current,
      name,
      status: args.input.status,
      data: { ...current.data, tenantIds },
      updatedAt: args.input.now,
      version: current.version + 1,
    };
    if (description) next.description = description;
    else delete next.description;
    const previousTenantIds = new Set(current.data.tenantIds);
    const nextTenantIds = new Set(tenantIds);
    const transactItems: NonNullable<
      TransactWriteCommandInput["TransactItems"]
    > = [
      ...tenantChecks(args.tableName, tenantIds),
      {
        Put: {
          TableName: args.tableName,
          Item: next,
          ConditionExpression: "version = :expectedVersion",
          ExpressionAttributeValues: {
            ":expectedVersion": args.input.expectedVersion,
          },
        },
      },
      ...tenantIds.map((tenantId) => ({
        Put: {
          TableName: args.tableName,
          Item: ciBuildStoredOrgUnitAttachment(next, tenantId),
        },
      })),
      ...[...previousTenantIds]
        .filter((tenantId) => !nextTenantIds.has(tenantId))
        .map((tenantId) => ({
          Delete: {
            TableName: args.tableName,
            Key: ciBuildOrgUnitTenantAttachmentKeys(
              tenantId,
              current.data.path,
            ),
            ConditionExpression: "#data.#orgUnitId = :orgUnitId",
            ExpressionAttributeNames: {
              "#data": "data",
              "#orgUnitId": "orgUnitId",
            },
            ExpressionAttributeValues: { ":orgUnitId": orgUnitId },
          },
        })),
    ];
    if (transactItems.length > 100) {
      throw new Error(
        "The Org Unit update exceeds DynamoDB's transaction limit.",
      );
    }
    await client.send(
      new TransactWriteCommand({ TransactItems: transactItems }),
    );
    return ciResponseOk({ orgUnit: ciOrgUnitToManagementRow(next) });
  } catch (error) {
    return ciResponseError(409, "Unable to update Org Unit.", {
      details: {
        message: error instanceof Error ? error.message : String(error),
      },
    });
  }
}
