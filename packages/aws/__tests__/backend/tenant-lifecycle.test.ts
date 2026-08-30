import assert from "node:assert/strict";
import test from "node:test";

import { CI_CORE_BACKEND_MANIFEST } from "@ci-aws/server/backend";
import { ciBuildResourcePolicyFragment } from "@ci-aws/server/backend/resources/resource-registry";
import {
  CI_TENANT_ACTIVE_PREFIX,
  CI_TENANT_COLLECTION_KEY,
  CI_TENANT_DELETED_PREFIX,
  ciAssertTenantMutable,
  ciAssertTenantOperationalStatusMutable,
  ciBuildTenantActiveSortKey,
  ciBuildTenantDeletedSortKey,
  ciBuildTenantPrimaryKey,
  ciBuildTenantSeedMarkerKeys,
  ciBuildTenantSeederPartitionKey,
  ciBuildTenantSlugKeys,
  ciRequireLifecycleReason,
  ciRequireTenantStatusReason,
} from "@ci-aws/lib/tenant";

test("builds exact tenant lifecycle keys through the CloudIgniter key helpers", () => {
  assert.deepEqual(ciBuildTenantPrimaryKey("Tenant-A"), {
    PK: "CI#SYSTEM#TENANT#Tenant-A",
    SK: "CI#META",
  });
  assert.equal(CI_TENANT_COLLECTION_KEY, "CI#SYSTEM#TENANTS");
  assert.equal(CI_TENANT_ACTIVE_PREFIX, "CI#ACTIVE");
  assert.equal(CI_TENANT_DELETED_PREFIX, "CI#DELETED");
  assert.equal(
    ciBuildTenantActiveSortKey("Tenant-A", "2026-08-28T10:00:00.000Z"),
    "CI#ACTIVE#2026-08-28T10:00:00.000Z#TENANT#Tenant-A",
  );
  assert.equal(
    ciBuildTenantDeletedSortKey("Tenant-A", "2026-08-28T11:00:00.000Z"),
    "CI#DELETED#2026-08-28T11:00:00.000Z#TENANT#Tenant-A",
  );
  assert.deepEqual(ciBuildTenantSlugKeys("Tenant-A", "tenant-a"), {
    GSI2PK: "CI#SYSTEM#TENANT_SLUG#tenant-a",
    GSI2SK: "CI#TENANT#Tenant-A",
  });
  assert.equal(
    ciBuildTenantSeederPartitionKey("test-tenants"),
    "CI#DEVELOPER#SEEDER#test-tenants",
  );
  assert.deepEqual(ciBuildTenantSeedMarkerKeys("test-tenants", "Tenant-A"), {
    PK: "CI#DEVELOPER#SEEDER#test-tenants",
    SK: "CI#RESOURCE#TENANT#Tenant-A",
  });
});

test("rejects protected tenants and lifecycle mutations without an operator reason", () => {
  assert.throws(
    () =>
      ciAssertTenantMutable({
        tenantId: "system",
        name: "System",
        status: "active",
        createdAt: "2026-08-28T10:00:00.000Z",
        updatedAt: "2026-08-28T10:00:00.000Z",
        PK: "CI#SYSTEM#TENANT#system",
        SK: "CI#META",
        GSI1PK: "CI#SYSTEM#TENANTS",
        GSI1SK: "CI#ACTIVE#2026-08-28T10:00:00.000Z#TENANT#system",
        type: "TENANT",
        id: "system",
        deletionState: "active",
        version: 1,
        data: { isSystem: true },
      }),
    /cannot be deleted/,
  );
  assert.throws(() => ciRequireLifecycleReason("  "), /at least 3 characters/);
  assert.equal(ciRequireLifecycleReason(" approved "), "approved");
  assert.throws(
    () => ciRequireTenantStatusReason("  "),
    /status-change reason of at least 3 characters/,
  );
  assert.equal(ciRequireTenantStatusReason(" approved "), "approved");
  assert.throws(
    () =>
      ciAssertTenantOperationalStatusMutable({
        tenantId: "archived",
        name: "Archived",
        status: "archived",
        createdAt: "2026-08-28T10:00:00.000Z",
        updatedAt: "2026-08-28T10:00:00.000Z",
        PK: "CI#SYSTEM#TENANT#archived",
        SK: "CI#META",
        GSI1PK: "CI#SYSTEM#TENANTS",
        GSI1SK: "CI#ACTIVE#2026-08-28T10:00:00.000Z#TENANT#archived",
        type: "TENANT",
        id: "archived",
        deletionState: "active",
        version: 1,
      }),
    /Archived tenant.*cannot be suspended or activated/,
  );
});

test("registers only the active tenant lifecycle handlers on the System table", () => {
  const systemModule = CI_CORE_BACKEND_MANIFEST.modules.find(
    (module) => module.id === "systemTable",
  );
  assert.ok(systemModule);
  assert.deepEqual(systemModule.handlers, [
    "ciCleanupSeededTenantsHandler",
    "ciDeleteTenantHandler",
    "ciListTenantsHandler",
    "ciPurgeTenantHandler",
    "ciRestoreTenantHandler",
    "ciSeedTenantsHandler",
    "ciSetTenantStatusHandler",
    "ciCreateOrgUnitHandler",
    "ciGetOrgUnitByPathHandler",
    "ciListOrgUnitsHandler",
    "ciUpdateOrgUnitHandler",
  ]);
});

test("uses bounded query access for Trash and separates soft delete from purge IAM", () => {
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
  const policies = fragment.inlinePolicies ?? [];
  const listActions = policies
    .filter((policy) => policy.for === "ciListTenantsHandler")
    .flatMap((policy) =>
      policy.statements.flatMap((statement) => statement.actions),
    );
  assert.deepEqual(listActions, ["dynamodb:Query"]);
  assert.ok(!listActions.includes("dynamodb:Scan"));

  const deleteActions = policies
    .filter((policy) => policy.for === "ciDeleteTenantHandler")
    .flatMap((policy) =>
      policy.statements.flatMap((statement) => statement.actions),
    );
  const purgeActions = policies
    .filter((policy) => policy.for === "ciPurgeTenantHandler")
    .flatMap((policy) =>
      policy.statements.flatMap((statement) => statement.actions),
    );
  assert.ok(deleteActions.includes("dynamodb:UpdateItem"));
  assert.ok(!deleteActions.includes("dynamodb:DeleteItem"));
  assert.ok(purgeActions.includes("dynamodb:DeleteItem"));

  const setStatusActions = policies
    .filter((policy) => policy.for === "ciSetTenantStatusHandler")
    .flatMap((policy) =>
      policy.statements.flatMap((statement) => statement.actions),
    );
  assert.deepEqual(setStatusActions, [
    "dynamodb:GetItem",
    "dynamodb:UpdateItem",
  ]);

  const seedActions = policies
    .filter((policy) => policy.for === "ciSeedTenantsHandler")
    .flatMap((policy) =>
      policy.statements.flatMap((statement) => statement.actions),
    );
  const cleanupActions = policies
    .filter((policy) => policy.for === "ciCleanupSeededTenantsHandler")
    .flatMap((policy) =>
      policy.statements.flatMap((statement) => statement.actions),
    );
  assert.deepEqual(seedActions, [
    "dynamodb:ConditionCheckItem",
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:TransactWriteItems",
    "dynamodb:UpdateItem",
  ]);
  assert.deepEqual(cleanupActions, [
    "dynamodb:GetItem",
    "dynamodb:Query",
    "dynamodb:DeleteItem",
    "dynamodb:TransactWriteItems",
    "dynamodb:UpdateItem",
  ]);
  assert.ok(!cleanupActions.includes("dynamodb:Scan"));
});
