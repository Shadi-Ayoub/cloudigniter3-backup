import assert from "node:assert/strict";
import test from "node:test";

import {
  DynamoDBDocumentClient,
  GetCommand,
  TransactWriteCommand,
  type TransactWriteCommandInput,
} from "@aws-sdk/lib-dynamodb";

import { CI_CORE_BACKEND_MANIFEST } from "@ci-aws/server/backend";
import { ciBuildResourcePolicyFragment } from "@ci-aws/server/backend/resources/resource-registry";
import {
  CI_ORG_UNIT_COLLECTION_KEY,
  ciBuildOrgUnitChildrenPartitionKey,
  ciBuildOrgUnitCollectionSortKey,
  ciBuildOrgUnitPrimaryKey,
  ciBuildOrgUnitSeedMarkerKeys,
  ciBuildStoredOrgUnitAttachment,
  ciBuildOrgUnitTenantAttachmentKeys,
  ciUpdateOrgUnit,
  ciRequireOrgUnitSlug,
  ciRequireOrgUnitTenantIds,
  type CiStoredOrgUnit,
} from "@ci-aws/lib/org-unit";
import { ciBuildMovedOrgUnitSubtree } from "../../src/lib/org-unit/ci-update-org-unit";

test("builds exact canonical and tenant-attachment Org Unit keys", () => {
  assert.equal(CI_ORG_UNIT_COLLECTION_KEY, "CI#SYSTEM#ORG_UNITS");
  assert.deepEqual(ciBuildOrgUnitPrimaryKey("Shared-Finance"), {
    PK: "CI#SYSTEM#ORG_UNIT#Shared-Finance",
    SK: "CI#META",
  });
  assert.equal(
    ciBuildOrgUnitCollectionSortKey(
      "/central-hq/shared-services/finance",
      "Shared-Finance",
    ),
    "CI#ORG_UNIT#/central-hq/shared-services/finance#Shared-Finance",
  );
  assert.equal(
    ciBuildOrgUnitChildrenPartitionKey("shared-services"),
    "CI#SYSTEM#ORG_UNIT_CHILDREN#shared-services",
  );
  assert.deepEqual(
    ciBuildOrgUnitTenantAttachmentKeys(
      "tenant-a",
      "/central-hq/shared-services/finance",
    ),
    {
      PK: "CI#SYSTEM#TENANT#tenant-a#ORG_UNITS",
      SK: "CI#PATH#/central-hq/shared-services/finance",
    },
  );
  assert.deepEqual(
    ciBuildOrgUnitSeedMarkerKeys("test-tenants", "shared-finance"),
    {
      PK: "CI#DEVELOPER#SEEDER#test-tenants",
      SK: "CI#RESOURCE#ORG_UNIT#shared-finance",
    },
  );
});

test("validates immutable path segments and shared tenant sets", () => {
  assert.equal(ciRequireOrgUnitSlug("shared-services"), "shared-services");
  assert.throws(
    () => ciRequireOrgUnitSlug("Shared Services"),
    /lowercase kebab/,
  );
  assert.deepEqual(
    ciRequireOrgUnitTenantIds(["tenant-b", "tenant-a", "tenant-b"]),
    ["tenant-a", "tenant-b"],
  );
  assert.throws(() => ciRequireOrgUnitTenantIds([]), /at least one tenant/);
});

test("omits optional undefined values from tenant attachments", () => {
  const orgUnit: CiStoredOrgUnit = {
    ...ciBuildOrgUnitPrimaryKey("shared-finance"),
    GSI1PK: CI_ORG_UNIT_COLLECTION_KEY,
    GSI1SK: "CI#ORG_UNIT#/shared-finance#shared-finance",
    GSI2PK: ciBuildOrgUnitChildrenPartitionKey(null),
    GSI2SK: "CI#ORG_UNIT#/shared-finance#shared-finance",
    id: "shared-finance",
    type: "ORG_UNIT",
    status: "active",
    deletionState: "active",
    name: "Shared Finance",
    data: {
      slug: "shared-finance",
      path: "/shared-finance",
      parentId: null,
      ancestorOrgUnitIds: [],
      tenantIds: ["tenant-a"],
      childIds: [],
    },
    createdAt: "2026-08-29T10:00:00.000Z",
    updatedAt: "2026-08-29T10:00:00.000Z",
    version: 1,
  };

  const attachment = ciBuildStoredOrgUnitAttachment(orgUnit, "tenant-a");
  assert.equal(Object.hasOwn(attachment, "description"), false);
  assert.equal(
    Object.values(attachment).some((value) => value === undefined),
    false,
  );
});

test("rewrites a moved subtree path and authoritative predecessor chain", () => {
  const stored = (
    id: string,
    path: string,
    parentId: string | null,
    ancestors: string[],
  ): CiStoredOrgUnit => ({
    ...ciBuildOrgUnitPrimaryKey(id),
    GSI1PK: CI_ORG_UNIT_COLLECTION_KEY,
    GSI1SK: ciBuildOrgUnitCollectionSortKey(path, id),
    GSI2PK: ciBuildOrgUnitChildrenPartitionKey(parentId),
    GSI2SK: ciBuildOrgUnitCollectionSortKey(path, id),
    id,
    type: "ORG_UNIT",
    status: "active",
    deletionState: "active",
    name: id,
    data: {
      slug: id,
      path,
      parentId,
      ancestorOrgUnitIds: ancestors,
      tenantIds: ["tenant-a"],
      childIds: [],
    },
    createdAt: "2026-08-29T10:00:00.000Z",
    updatedAt: "2026-08-29T10:00:00.000Z",
    version: 2,
  });
  const target = stored("target", "/other-root/target", "other-root", [
    "other-root",
  ]);
  const root = stored("finance", "/central-hq/finance", "central-hq", [
    "central-hq",
  ]);
  const leaf = stored("payroll", "/central-hq/finance/payroll", "finance", [
    "central-hq",
    "finance",
  ]);
  root.data.childIds = [leaf.id];

  const moved = ciBuildMovedOrgUnitSubtree({
    subtree: [root, leaf],
    newParent: target,
    changes: {
      name: "Shared Finance",
      status: "suspended",
      tenantIds: ["tenant-a"],
    },
    now: "2026-08-30T10:00:00.000Z",
  });

  assert.equal(moved[0]?.data.path, "/other-root/target/finance");
  assert.deepEqual(moved[0]?.data.ancestorOrgUnitIds, ["other-root", "target"]);
  assert.equal(moved[0]?.status, "suspended");
  assert.equal(moved[1]?.data.path, "/other-root/target/finance/payroll");
  assert.deepEqual(moved[1]?.data.ancestorOrgUnitIds, [
    "other-root",
    "target",
    "finance",
  ]);
  assert.equal(moved[1]?.version, 3);
});

test("persists a requested parent through the provider update transaction", async () => {
  const stored = (
    id: string,
    path: string,
    parentId: string | null,
    childIds: string[],
  ): CiStoredOrgUnit => ({
    ...ciBuildOrgUnitPrimaryKey(id),
    GSI1PK: CI_ORG_UNIT_COLLECTION_KEY,
    GSI1SK: ciBuildOrgUnitCollectionSortKey(path, id),
    GSI2PK: ciBuildOrgUnitChildrenPartitionKey(parentId),
    GSI2SK: ciBuildOrgUnitCollectionSortKey(path, id),
    id,
    type: "ORG_UNIT",
    status: "active",
    deletionState: "active",
    name: id,
    data: {
      slug: id,
      path,
      parentId,
      ancestorOrgUnitIds: parentId ? [parentId] : [],
      tenantIds: ["tenant-a"],
      childIds,
    },
    createdAt: "2026-08-29T10:00:00.000Z",
    updatedAt: "2026-08-29T10:00:00.000Z",
    version: 2,
  });
  const oldParent = stored("old-parent", "/old-parent", null, ["finance"]);
  const newParent = stored("new-parent", "/new-parent", null, []);
  const finance = stored(
    "finance",
    "/old-parent/finance",
    oldParent.id,
    [],
  );
  const records = new Map(
    [oldParent, newParent, finance].map((row) => [row.PK, row]),
  );
  let transaction: TransactWriteCommandInput | undefined;
  const originalFrom = DynamoDBDocumentClient.from;
  Object.defineProperty(DynamoDBDocumentClient, "from", {
    configurable: true,
    value: () => ({
      send: async (command: unknown) => {
        if (command instanceof GetCommand) {
          return { Item: records.get(String(command.input.Key?.PK)) };
        }
        if (command instanceof TransactWriteCommand) {
          transaction = command.input;
          return {};
        }
        throw new Error("Unexpected DynamoDB command in Org Unit move test.");
      },
    }),
  });

  try {
    const response = await ciUpdateOrgUnit({
      tableName: "System",
      clientConfig: { region: "us-east-1" },
      input: {
        orgUnitId: finance.id,
        parentId: newParent.id,
        name: "Finance",
        status: "active",
        tenantIds: ["tenant-a"],
        expectedVersion: finance.version,
        actorId: "system-admin",
        now: "2026-08-30T10:00:00.000Z",
      },
    });

    assert.equal(response.ok, true);
    if (!response.ok) return;
    assert.equal(response.body.orgUnit.parentId, newParent.id);
    assert.equal(response.body.orgUnit.path, "/new-parent/finance");
    const movedPut = transaction?.TransactItems?.find(
      (item) => item.Put?.Item?.id === finance.id,
    )?.Put?.Item as CiStoredOrgUnit | undefined;
    assert.equal(movedPut?.data.parentId, newParent.id);
    assert.equal(movedPut?.data.path, "/new-parent/finance");
    const parentUpdates = transaction?.TransactItems?.filter(
      (item) => item.Update,
    );
    assert.equal(parentUpdates?.length, 2);
  } finally {
    Object.defineProperty(DynamoDBDocumentClient, "from", {
      configurable: true,
      value: originalFrom,
    });
  }
});

test("registers bounded Org Unit handlers and least-privilege access", () => {
  const systemModule = CI_CORE_BACKEND_MANIFEST.modules.find(
    (module) => module.id === "systemTable",
  );
  assert.ok(systemModule?.handlers.includes("ciCreateOrgUnitHandler"));
  assert.ok(systemModule?.handlers.includes("ciGetOrgUnitByPathHandler"));
  assert.ok(systemModule?.handlers.includes("ciListOrgUnitsHandler"));
  assert.ok(systemModule?.handlers.includes("ciUpdateOrgUnitHandler"));

  const fragment = ciBuildResourcePolicyFragment({
    resources: {
      auth: { enabled: true },
      emberguardAccessTable: { name: "Access", arn: "arn:access" },
      systemTable: { name: "System", arn: "arn:system" },
      userProfileTable: { name: "Profiles", arn: "arn:profiles" },
    },
    region: "me-central-1",
    envMode: "test",
    options: { includeDefaultDynamoPolicies: true },
  });
  const actionsFor = (handler: string) =>
    (fragment.inlinePolicies ?? [])
      .filter((policy) => policy.for === handler)
      .flatMap((policy) =>
        policy.statements.flatMap((statement) => statement.actions),
      );
  assert.deepEqual(actionsFor("ciGetOrgUnitByPathHandler"), [
    "dynamodb:GetItem",
  ]);
  assert.deepEqual(actionsFor("ciListOrgUnitsHandler"), ["dynamodb:Query"]);
  assert.ok(!actionsFor("ciListOrgUnitsHandler").includes("dynamodb:Scan"));
  assert.deepEqual(actionsFor("ciUpdateOrgUnitHandler"), [
    "dynamodb:GetItem",
    "dynamodb:BatchGetItem",
    "dynamodb:ConditionCheckItem",
    "dynamodb:DeleteItem",
    "dynamodb:PutItem",
    "dynamodb:TransactWriteItems",
    "dynamodb:UpdateItem",
  ]);

  assert.deepEqual(actionsFor("ciCreateOrgUnitHandler"), [
    "dynamodb:ConditionCheckItem",
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:TransactWriteItems",
    "dynamodb:UpdateItem",
  ]);
});
