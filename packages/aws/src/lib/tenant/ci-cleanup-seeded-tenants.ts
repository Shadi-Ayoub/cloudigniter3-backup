import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
  type TransactWriteCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { ciResponseError, ciResponseOk } from "@cloudigniter/core/lib";
import type {
  CiCleanupSeededTenantsInput,
  CiResponse,
  CiSeederExecutionItemResult,
  CiTenantSeederExecutionResult,
} from "@cloudigniter/core/types";
import {
  ciBuildTenantPrimaryKey,
  ciBuildTenantSeederPartitionKey,
  type CiStoredTenant,
} from "./ci-tenant-record";
import {
  ciBuildOrgUnitPrimaryKey,
  ciBuildOrgUnitTenantAttachmentKeys,
  type CiStoredOrgUnit,
} from "../org-unit";

function isOwnedBySeeder(
  tenant: CiStoredTenant | undefined,
  seederId: string,
): boolean {
  const seed = tenant?.data?.seed;
  return (
    tenant?.data?.isSystem !== true &&
    typeof seed === "object" &&
    seed !== null &&
    (seed as Record<string, unknown>).seederId === seederId
  );
}

/** Garbage-collects only tenant and Org Unit records with matching provenance. */
export async function ciCleanupSeededTenants(args: {
  tableName: string;
  clientConfig: DynamoDBClientConfig;
  input: CiCleanupSeededTenantsInput;
}): Promise<CiResponse<CiTenantSeederExecutionResult>> {
  try {
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(args.input.seederId)) {
      return ciResponseError(400, "Seeder IDs must use lowercase kebab case.");
    }
    const client = DynamoDBDocumentClient.from(
      new DynamoDBClient(args.clientConfig),
    );
    const results: CiSeederExecutionItemResult[] = [];
    const markers: Array<Record<string, unknown>> = [];
    let exclusiveStartKey: Record<string, unknown> | undefined;
    do {
      const page = await client.send(
        new QueryCommand({
          TableName: args.tableName,
          KeyConditionExpression: "PK = :pk",
          ExpressionAttributeValues: {
            ":pk": ciBuildTenantSeederPartitionKey(args.input.seederId),
          },
          ExclusiveStartKey: exclusiveStartKey,
          ConsistentRead: true,
          Limit: 100,
        }),
      );
      markers.push(...(page.Items ?? []));
      exclusiveStartKey = page.LastEvaluatedKey;
    } while (exclusiveStartKey);

    // Remove descendants before predecessors so a partial cleanup never
    // leaves a surviving seeded node whose parent was already removed.
    const orgUnitDepths = new Map<string, number>();
    for (const marker of markers) {
      if (
        marker.targetType !== "ORG_UNIT" ||
        typeof marker.targetId !== "string"
      ) {
        continue;
      }
      const current = await client.send(
        new GetCommand({
          TableName: args.tableName,
          Key: ciBuildOrgUnitPrimaryKey(marker.targetId),
          ConsistentRead: true,
        }),
      );
      const orgUnit = current.Item as CiStoredOrgUnit | undefined;
      orgUnitDepths.set(
        marker.targetId,
        orgUnit?.data.ancestorOrgUnitIds.length ?? -1,
      );
    }
    markers.sort((left, right) => {
      const leftOrgUnit = left.targetType === "ORG_UNIT";
      const rightOrgUnit = right.targetType === "ORG_UNIT";
      if (leftOrgUnit !== rightOrgUnit) return leftOrgUnit ? -1 : 1;
      if (!leftOrgUnit) return 0;
      return (
        (orgUnitDepths.get(String(right.targetId)) ?? -1) -
        (orgUnitDepths.get(String(left.targetId)) ?? -1)
      );
    });

    for (const marker of markers) {
      const tenantId =
        typeof marker.targetId === "string" ? marker.targetId : undefined;
      const targetPk =
        typeof marker.targetPk === "string" ? marker.targetPk : undefined;
      const targetSk =
        typeof marker.targetSk === "string" ? marker.targetSk : undefined;
      if (!tenantId || !targetPk || !targetSk) {
        results.push({
          id: String(marker.SK ?? "unknown-marker"),
          status: "failed",
          message:
            "The seed marker is malformed and was preserved for inspection.",
        });
        continue;
      }

      if (marker.targetType === "ORG_UNIT") {
        const orgUnitId = tenantId;
        const key = ciBuildOrgUnitPrimaryKey(orgUnitId);
        if (key.PK !== targetPk || key.SK !== targetSk) {
          results.push({
            id: orgUnitId,
            status: "failed",
            message:
              "The seed marker target does not match the canonical Org Unit key.",
          });
          continue;
        }
        const current = await client.send(
          new GetCommand({
            TableName: args.tableName,
            Key: key,
            ConsistentRead: true,
          }),
        );
        const orgUnit = current.Item as CiStoredOrgUnit | undefined;
        if (!orgUnit) {
          await client.send(
            new TransactWriteCommand({
              TransactItems: [
                {
                  Delete: {
                    TableName: args.tableName,
                    Key: { PK: marker.PK, SK: marker.SK },
                    ConditionExpression: "seedSetId = :seederId",
                    ExpressionAttributeValues: {
                      ":seederId": args.input.seederId,
                    },
                  },
                },
              ],
            }),
          );
          results.push({
            id: orgUnitId,
            status: "deleted",
            message:
              "Removed an orphaned seed marker; the Org Unit was already absent.",
          });
          continue;
        }
        if (orgUnit.data.seed?.seederId !== args.input.seederId) {
          results.push({
            id: orgUnitId,
            status: "skipped",
            message: "Org Unit is not owned by this seeder and was preserved.",
          });
          continue;
        }
        if ((orgUnit.data.childIds ?? []).length > 0) {
          results.push({
            id: orgUnitId,
            status: "failed",
            message:
              "Org Unit still has child nodes and was preserved to avoid orphaning its subtree.",
          });
          continue;
        }
        const parentUpdates: NonNullable<
          TransactWriteCommandInput["TransactItems"]
        > = [];
        if (orgUnit.data.parentId) {
          const parentKey = ciBuildOrgUnitPrimaryKey(orgUnit.data.parentId);
          const parentResponse = await client.send(
            new GetCommand({
              TableName: args.tableName,
              Key: parentKey,
              ConsistentRead: true,
            }),
          );
          const parent = parentResponse.Item as CiStoredOrgUnit | undefined;
          const childIndex = parent?.data.childIds?.indexOf(orgUnitId) ?? -1;
          if (parent && childIndex >= 0) {
            parentUpdates.push({
              Update: {
                TableName: args.tableName,
                Key: parentKey,
                ConditionExpression: "version = :parentVersion",
                UpdateExpression: `SET updatedAt = :now, version = version + :one REMOVE #data.#childIds[${childIndex}]`,
                ExpressionAttributeNames: {
                  "#data": "data",
                  "#childIds": "childIds",
                },
                ExpressionAttributeValues: {
                  ":parentVersion": parent.version,
                  ":now": new Date().toISOString(),
                  ":one": 1,
                },
              },
            });
          }
        }
        try {
          await client.send(
            new TransactWriteCommand({
              TransactItems: [
                ...orgUnit.data.tenantIds.map((attachedTenantId) => ({
                  Delete: {
                    TableName: args.tableName,
                    Key: ciBuildOrgUnitTenantAttachmentKeys(
                      attachedTenantId,
                      orgUnit.data.path,
                    ),
                    ConditionExpression: "#data.#orgUnitId = :orgUnitId",
                    ExpressionAttributeNames: {
                      "#data": "data",
                      "#orgUnitId": "orgUnitId",
                    },
                    ExpressionAttributeValues: { ":orgUnitId": orgUnitId },
                  },
                })),
                ...parentUpdates,
                {
                  Delete: {
                    TableName: args.tableName,
                    Key: key,
                    ConditionExpression: "#data.#seed.#seederId = :seederId",
                    ExpressionAttributeNames: {
                      "#data": "data",
                      "#seed": "seed",
                      "#seederId": "seederId",
                    },
                    ExpressionAttributeValues: {
                      ":seederId": args.input.seederId,
                    },
                  },
                },
                {
                  Delete: {
                    TableName: args.tableName,
                    Key: { PK: marker.PK, SK: marker.SK },
                    ConditionExpression: "seedSetId = :seederId",
                    ExpressionAttributeValues: {
                      ":seederId": args.input.seederId,
                    },
                  },
                },
              ],
            }),
          );
          results.push({ id: orgUnitId, status: "deleted" });
        } catch (error) {
          results.push({
            id: orgUnitId,
            status: "failed",
            message:
              (error as { name?: string }).name ===
              "TransactionCanceledException"
                ? "Org Unit ownership changed before cleanup; it was preserved."
                : error instanceof Error
                  ? error.message
                  : String(error),
          });
        }
        continue;
      }
      const key = ciBuildTenantPrimaryKey(tenantId);
      if (key.PK !== targetPk || key.SK !== targetSk) {
        results.push({
          id: tenantId,
          status: "failed",
          message:
            "The seed marker target does not match the canonical tenant key.",
        });
        continue;
      }
      const current = await client.send(
        new GetCommand({
          TableName: args.tableName,
          Key: key,
          ConsistentRead: true,
        }),
      );
      const tenant = current.Item as CiStoredTenant | undefined;
      if (!tenant) {
        await client.send(
          new TransactWriteCommand({
            TransactItems: [
              {
                Delete: {
                  TableName: args.tableName,
                  Key: { PK: marker.PK, SK: marker.SK },
                  ConditionExpression: "seedSetId = :seederId",
                  ExpressionAttributeValues: {
                    ":seederId": args.input.seederId,
                  },
                },
              },
            ],
          }),
        );
        results.push({
          id: tenantId,
          status: "deleted",
          message:
            "Removed an orphaned seed marker; the tenant was already absent.",
        });
        continue;
      }
      if (!isOwnedBySeeder(tenant, args.input.seederId)) {
        results.push({
          id: tenantId,
          status: "skipped",
          message: "Tenant is not owned by this seeder and was preserved.",
        });
        continue;
      }
      try {
        await client.send(
          new TransactWriteCommand({
            TransactItems: [
              {
                Delete: {
                  TableName: args.tableName,
                  Key: key,
                  ConditionExpression:
                    "#data.#seed.#seederId = :seederId AND (#data.#isSystem = :false OR attribute_not_exists(#data.#isSystem))",
                  ExpressionAttributeNames: {
                    "#data": "data",
                    "#seed": "seed",
                    "#seederId": "seederId",
                    "#isSystem": "isSystem",
                  },
                  ExpressionAttributeValues: {
                    ":seederId": args.input.seederId,
                    ":false": false,
                  },
                },
              },
              {
                Delete: {
                  TableName: args.tableName,
                  Key: { PK: marker.PK, SK: marker.SK },
                  ConditionExpression: "seedSetId = :seederId",
                  ExpressionAttributeValues: {
                    ":seederId": args.input.seederId,
                  },
                },
              },
            ],
          }),
        );
        results.push({ id: tenantId, status: "deleted" });
      } catch (error) {
        results.push({
          id: tenantId,
          status: "failed",
          message:
            (error as { name?: string }).name === "TransactionCanceledException"
              ? "Tenant ownership changed before cleanup; it was preserved."
              : error instanceof Error
                ? error.message
                : String(error),
        });
      }
    }

    const deleted = results.filter(
      (result) => result.status === "deleted",
    ).length;
    const skipped = results.filter(
      (result) => result.status === "skipped",
    ).length;
    const failed = results.filter(
      (result) => result.status === "failed",
    ).length;
    return ciResponseOk({
      ok: failed === 0,
      seederId: args.input.seederId,
      operation: "cleanup",
      created: 0,
      deleted,
      skipped,
      failed,
      items: results,
      resources: [],
      orgUnits: [],
    });
  } catch (error) {
    return ciResponseError(400, "Unable to clean up seeded tenants.", {
      details: {
        message: error instanceof Error ? error.message : String(error),
      },
    });
  }
}
