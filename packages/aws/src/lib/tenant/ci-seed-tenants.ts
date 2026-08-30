import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { ciResponseError, ciResponseOk } from "@cloudigniter/core/lib";
import type {
  CiOrgUnitSeederDataItem,
  CiResponse,
  CiSeedTenantsInput,
  CiSeederExecutionItemResult,
  CiSeedMarkerDdbItem,
  CiTenantSeederExecutionResult,
} from "@cloudigniter/core/types";
import {
  ciBuildOrgUnitPrimaryKey,
  ciCreateOrgUnit,
  ciOrgUnitToManagementRow,
  type CiStoredOrgUnit,
} from "../org-unit";
import {
  CI_TENANT_COLLECTION_KEY,
  ciBuildTenantActiveSortKey,
  ciBuildTenantPrimaryKey,
  ciBuildTenantSeedMarkerKeys,
  ciBuildTenantSlugKeys,
  ciTenantToTableRow,
  type CiStoredTenant,
} from "./ci-tenant-record";

export type CiSeedTenantsServiceInput = CiSeedTenantsInput & {
  actorId: string;
  now: string;
};

function assertSeederId(seederId: string): void {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(seederId)) {
    throw new Error("Seeder IDs must use lowercase kebab case.");
  }
}

function requireText(value: string, label: string): string {
  const text = value.trim();
  if (!text) throw new Error(`${label} is required.`);
  return text;
}

function isSameSeederRecord(
  tenant: CiStoredTenant | undefined,
  seederId: string,
): tenant is CiStoredTenant {
  const seed = tenant?.data?.seed;
  return (
    typeof seed === "object" &&
    seed !== null &&
    (seed as Record<string, unknown>).seederId === seederId
  );
}

export async function ciSeedTenants(args: {
  tableName: string;
  clientConfig: DynamoDBClientConfig;
  input: CiSeedTenantsServiceInput;
}): Promise<CiResponse<CiTenantSeederExecutionResult>> {
  try {
    assertSeederId(args.input.seederId);
    if (!Array.isArray(args.input.items) || args.input.items.length === 0) {
      return ciResponseError(
        400,
        "Tenant seeder data must contain at least one item.",
      );
    }

    const client = DynamoDBDocumentClient.from(
      new DynamoDBClient(args.clientConfig),
      { marshallOptions: { removeUndefinedValues: true } },
    );
    const results: CiSeederExecutionItemResult[] = [];
    const resources: CiTenantSeederExecutionResult["resources"] = [];
    const fixtureIds = new Set<string>();
    const fixtureSlugs = new Set<string>();
    const orgUnitFixtures: CiOrgUnitSeederDataItem[] = [];
    const orgUnitFixtureIds = new Set<string>();
    const orgUnitResources: NonNullable<
      CiTenantSeederExecutionResult["orgUnits"]
    > = [];

    for (const fixture of args.input.items) {
      const tenantId = requireText(fixture.tenantId, "Tenant ID");
      const slug = requireText(fixture.slug, `Slug for tenant "${tenantId}"`);
      const name = requireText(fixture.name, `Name for tenant "${tenantId}"`);
      if (fixtureIds.has(tenantId) || fixtureSlugs.has(slug)) {
        results.push({
          id: tenantId,
          status: "failed",
          message: "The fixture contains a duplicate tenant ID or slug.",
        });
        continue;
      }
      fixtureIds.add(tenantId);
      fixtureSlugs.add(slug);
      for (const orgUnit of fixture.orgUnits ?? []) {
        if (orgUnitFixtureIds.has(orgUnit.orgUnitId)) {
          results.push({
            id: orgUnit.orgUnitId,
            status: "failed",
            message: "The fixture contains a duplicate Org Unit ID.",
          });
          continue;
        }
        orgUnitFixtureIds.add(orgUnit.orgUnitId);
        orgUnitFixtures.push(orgUnit);
      }

      const key = ciBuildTenantPrimaryKey(tenantId);
      const tenant: CiStoredTenant = {
        ...key,
        ...ciBuildTenantSlugKeys(tenantId, slug),
        GSI1PK: CI_TENANT_COLLECTION_KEY,
        GSI1SK: ciBuildTenantActiveSortKey(tenantId, args.input.now),
        id: tenantId,
        type: "TENANT",
        tenantId,
        status: fixture.status ?? "active",
        deletionState: "active",
        name,
        description: fixture.description,
        data: {
          slug,
          region: fixture.region,
          tenantType: fixture.tenantType,
          usersCount: fixture.usersCount,
          isSystem: false,
          meta: fixture.meta,
          seed: {
            seederId: args.input.seederId,
            seededAt: args.input.now,
            seededBy: args.input.actorId,
          },
        },
        createdAt: args.input.now,
        updatedAt: args.input.now,
        version: 1,
      };
      const markerKeys = ciBuildTenantSeedMarkerKeys(
        args.input.seederId,
        tenantId,
      );
      const marker: CiSeedMarkerDdbItem = {
        ...markerKeys,
        type: "SEED_MARKER",
        id: `${args.input.seederId}:${tenantId}`,
        seedSetId: args.input.seederId,
        item: "TENANT",
        targetPk: key.PK,
        targetSk: key.SK,
        seededAt: args.input.now,
        seededBy: args.input.actorId,
        targetType: "TENANT",
        targetId: tenantId,
      };

      try {
        await client.send(
          new TransactWriteCommand({
            TransactItems: [
              {
                Put: {
                  TableName: args.tableName,
                  Item: tenant,
                  ConditionExpression: "attribute_not_exists(PK)",
                },
              },
              {
                Put: {
                  TableName: args.tableName,
                  Item: marker,
                  ConditionExpression:
                    "attribute_not_exists(PK) AND attribute_not_exists(SK)",
                },
              },
            ],
          }),
        );
        results.push({ id: tenantId, status: "created" });
        resources.push(ciTenantToTableRow(tenant));
      } catch (error) {
        if (
          (error as { name?: string }).name !== "TransactionCanceledException"
        ) {
          results.push({
            id: tenantId,
            status: "failed",
            message: error instanceof Error ? error.message : String(error),
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
        const currentTenant = current.Item as CiStoredTenant | undefined;
        if (isSameSeederRecord(currentTenant, args.input.seederId)) {
          results.push({
            id: tenantId,
            status: "skipped",
            message: "This seeder already owns the tenant.",
          });
          resources.push(ciTenantToTableRow(currentTenant));
        } else {
          results.push({
            id: tenantId,
            status: "failed",
            message: "A tenant not owned by this seeder already uses this ID.",
          });
        }
      }
    }

    // Org Units are deliberately created after all tenant records. Fixture
    // order is parent-first so shared attachment invariants can be checked at
    // each authoritative predecessor.
    for (const fixture of orgUnitFixtures) {
      const response = await ciCreateOrgUnit({
        tableName: args.tableName,
        clientConfig: args.clientConfig,
        input: {
          ...fixture,
          actorId: args.input.actorId,
          now: args.input.now,
          seed: { seederId: args.input.seederId },
        },
      });
      if (response.ok) {
        results.push({ id: fixture.orgUnitId, status: "created" });
        orgUnitResources.push(response.body.orgUnit);
        continue;
      }

      const current = await client.send(
        new GetCommand({
          TableName: args.tableName,
          Key: ciBuildOrgUnitPrimaryKey(fixture.orgUnitId),
          ConsistentRead: true,
        }),
      );
      const orgUnit = current.Item as CiStoredOrgUnit | undefined;
      if (orgUnit?.data.seed?.seederId === args.input.seederId) {
        results.push({
          id: fixture.orgUnitId,
          status: "skipped",
          message: "This seeder already owns the Org Unit.",
        });
        orgUnitResources.push(ciOrgUnitToManagementRow(orgUnit));
      } else {
        const failureBody = response.body as {
          error?: unknown;
          details?: { message?: unknown };
        };
        results.push({
          id: fixture.orgUnitId,
          status: "failed",
          message:
            typeof failureBody.details?.message === "string"
              ? failureBody.details.message
              : typeof failureBody.error === "string"
                ? failureBody.error
                : "The Org Unit could not be seeded.",
        });
      }
    }

    const created = results.filter(
      (result) => result.status === "created",
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
      operation: "seed",
      created,
      deleted: 0,
      skipped,
      failed,
      items: results,
      resources,
      orgUnits: orgUnitResources,
    });
  } catch (error) {
    return ciResponseError(400, "Unable to seed tenants.", {
      details: {
        message: error instanceof Error ? error.message : String(error),
      },
    });
  }
}
