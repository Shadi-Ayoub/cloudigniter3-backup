import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  TransactWriteCommand,
  type TransactWriteCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { ciResponseError, ciResponseOk } from "@cloudigniter/core/lib";
import type {
  CiCreateOrgUnitInput,
  CiOrgUnitMutationResult,
  CiResponse,
  CiSeedMarkerDdbItem,
} from "@cloudigniter/core/types";
import { ciBuildTenantPrimaryKey } from "../tenant/ci-tenant-record";
import {
  CI_ORG_UNIT_COLLECTION_KEY,
  ciBuildOrgUnitCollectionSortKey,
  ciBuildOrgUnitChildrenPartitionKey,
  ciBuildOrgUnitPrimaryKey,
  ciBuildOrgUnitSeedMarkerKeys,
  ciBuildStoredOrgUnitAttachment,
  ciOrgUnitToManagementRow,
  ciRequireOrgUnitSlug,
  ciRequireOrgUnitTenantIds,
  ciRequireOrgUnitText,
  type CiStoredOrgUnit,
} from "./ci-org-unit-record";

export type CiCreateOrgUnitServiceInput = CiCreateOrgUnitInput & {
  actorId: string;
  now: string;
  seed?: { seederId: string };
};

export async function ciCreateOrgUnit(args: {
  tableName: string;
  clientConfig: DynamoDBClientConfig;
  input: CiCreateOrgUnitServiceInput;
}): Promise<CiResponse<CiOrgUnitMutationResult>> {
  try {
    const orgUnitId = ciRequireOrgUnitText(args.input.orgUnitId, "Org Unit ID");
    const name = ciRequireOrgUnitText(args.input.name, "Org Unit name");
    const description = args.input.description?.trim();
    const slug = ciRequireOrgUnitSlug(args.input.slug);
    const tenantIds = ciRequireOrgUnitTenantIds(args.input.tenantIds);
    const parentId = args.input.parentId?.trim() || null;
    const client = DynamoDBDocumentClient.from(
      new DynamoDBClient(args.clientConfig),
      { marshallOptions: { removeUndefinedValues: true } },
    );

    let parent: CiStoredOrgUnit | undefined;
    if (parentId) {
      const response = await client.send(
        new GetCommand({
          TableName: args.tableName,
          Key: ciBuildOrgUnitPrimaryKey(parentId),
          ConsistentRead: true,
        }),
      );
      parent = response.Item as CiStoredOrgUnit | undefined;
      if (!parent)
        throw new Error(`Parent Org Unit "${parentId}" was not found.`);
      const missingParentTenant = tenantIds.find(
        (tenantId) => !parent?.data.tenantIds.includes(tenantId),
      );
      if (missingParentTenant) {
        throw new Error(
          `Tenant "${missingParentTenant}" is not attached to parent Org Unit "${parentId}".`,
        );
      }
    }

    const path = `${parent?.data.path ?? ""}/${slug}`;
    const ancestorOrgUnitIds = parent
      ? [...parent.data.ancestorOrgUnitIds, parent.id]
      : [];
    const key = ciBuildOrgUnitPrimaryKey(orgUnitId);
    const orgUnit: CiStoredOrgUnit = {
      ...key,
      GSI1PK: CI_ORG_UNIT_COLLECTION_KEY,
      GSI1SK: ciBuildOrgUnitCollectionSortKey(path, orgUnitId),
      GSI2PK: ciBuildOrgUnitChildrenPartitionKey(parentId),
      GSI2SK: ciBuildOrgUnitCollectionSortKey(path, orgUnitId),
      id: orgUnitId,
      type: "ORG_UNIT",
      status: args.input.status ?? "active",
      deletionState: "active",
      name,
      ...(description ? { description } : {}),
      data: {
        slug,
        path,
        parentId,
        ancestorOrgUnitIds,
        tenantIds,
        childIds: [],
        ...(args.input.meta !== undefined ? { meta: args.input.meta } : {}),
        ...(args.input.seed
          ? {
              seed: {
                seederId: args.input.seed.seederId,
                seededAt: args.input.now,
                seededBy: args.input.actorId,
              },
            }
          : {}),
      },
      createdAt: args.input.now,
      updatedAt: args.input.now,
      version: 1,
    };

    const items: NonNullable<TransactWriteCommandInput["TransactItems"]> = [
      ...tenantIds.map((tenantId) => ({
        ConditionCheck: {
          TableName: args.tableName,
          Key: ciBuildTenantPrimaryKey(tenantId),
          ConditionExpression:
            "attribute_exists(PK) AND (attribute_not_exists(deletionState) OR deletionState = :active)",
          ExpressionAttributeValues: { ":active": "active" },
        },
      })),
      {
        Put: {
          TableName: args.tableName,
          Item: orgUnit,
          ConditionExpression: "attribute_not_exists(PK)",
        },
      },
      ...tenantIds.map((tenantId) => ({
        Put: {
          TableName: args.tableName,
          Item: ciBuildStoredOrgUnitAttachment(orgUnit, tenantId),
          ConditionExpression:
            "attribute_not_exists(PK) AND attribute_not_exists(SK)",
        },
      })),
    ];

    if (parent) {
      items.push({
        Update: {
          TableName: args.tableName,
          Key: ciBuildOrgUnitPrimaryKey(parent.id),
          ConditionExpression: "version = :parentVersion",
          UpdateExpression:
            "SET #data.#childIds = list_append(if_not_exists(#data.#childIds, :empty), :child), updatedAt = :now, version = version + :one",
          ExpressionAttributeNames: {
            "#data": "data",
            "#childIds": "childIds",
          },
          ExpressionAttributeValues: {
            ":parentVersion": parent.version,
            ":empty": [],
            ":child": [orgUnitId],
            ":now": args.input.now,
            ":one": 1,
          },
        },
      });
    }

    if (args.input.seed) {
      const markerKeys = ciBuildOrgUnitSeedMarkerKeys(
        args.input.seed.seederId,
        orgUnitId,
      );
      const marker: CiSeedMarkerDdbItem = {
        ...markerKeys,
        type: "SEED_MARKER",
        id: `${args.input.seed.seederId}:${orgUnitId}`,
        seedSetId: args.input.seed.seederId,
        item: "ORG_UNIT",
        targetPk: key.PK,
        targetSk: key.SK,
        seededAt: args.input.now,
        seededBy: args.input.actorId,
        targetType: "ORG_UNIT",
        targetId: orgUnitId,
      };
      items.push({
        Put: {
          TableName: args.tableName,
          Item: marker,
          ConditionExpression:
            "attribute_not_exists(PK) AND attribute_not_exists(SK)",
        },
      });
    }

    if (items.length > 100) {
      throw new Error(
        "The Org Unit write exceeds DynamoDB's transaction limit.",
      );
    }
    await client.send(new TransactWriteCommand({ TransactItems: items }));
    return ciResponseOk({ orgUnit: ciOrgUnitToManagementRow(orgUnit) });
  } catch (error) {
    return ciResponseError(409, "Unable to create Org Unit.", {
      details: {
        message: error instanceof Error ? error.message : String(error),
      },
    });
  }
}
