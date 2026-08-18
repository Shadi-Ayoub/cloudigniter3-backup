import assert from "node:assert/strict";
import test from "node:test";

import {
  ciCreateAwsEmberguardProvider,
  type CiAwsEmberguardDatabase,
} from "../../src/providers/aws";
import { Emberguard } from "../../src/lib";
import {
  ciBuildSecurityRoleCounters,
  ciCreateAppAccessControl,
} from "../../src/lib";
import type { CiAccessControlDefinition } from "../../src/types";

const CANONICAL_KEY = {
  PK: "CI#EMBERGUARD#ACCESS_CONTROL",
  SK: "CI#DEFINITION#ACTIVE",
} as const;

const DEFINITION: CiAccessControlDefinition = {
  domains: [],
  resources: [],
  roles: [],
};

function createDatabase(
  readItem: CiAwsEmberguardDatabase["readItem"],
  writeItem: CiAwsEmberguardDatabase["writeItem"] = async () => ({ ok: true }),
  transactWrite: CiAwsEmberguardDatabase["transactWrite"] = async () => ({
    ok: true,
  }),
): CiAwsEmberguardDatabase {
  return {
    readItem,
    writeItem,
    async queryItems() {
      return { ok: true, body: { items: [] } };
    },
    async deleteItem() {
      return { ok: true };
    },
    transactWrite,
  };
}

function createProvider(database: CiAwsEmberguardDatabase) {
  return ciCreateAwsEmberguardProvider({
    database,
    tables: { accessTableName: "EmberguardAccess" },
    keys: {
      accessControlDefinition: CANONICAL_KEY,
      roleAssignment: ({ id, subjectId, tenantId }) => ({
        record: {
          PK: `CI#EMBERGUARD#SUBJECT#${subjectId}#ROLE_ASSIGNMENTS`,
          SK: `CI#ROLE_ASSIGNMENT#${id}`,
        },
        collection: {
          PK: "CI#EMBERGUARD#ROLE_ASSIGNMENTS",
          SK: `CI#TENANT#${
            tenantId ?? "global"
          }#SUBJECT#${subjectId}#ROLE_ASSIGNMENT#${id}`,
        },
      }),
      roleAssignmentsBySubject: (subjectId) =>
        `CI#EMBERGUARD#SUBJECT#${subjectId}#ROLE_ASSIGNMENTS`,
      roleAssignmentsCollection: "CI#EMBERGUARD#ROLE_ASSIGNMENTS",
      roleAssignmentsByTenant: (tenantId) => `CI#TENANT#${tenantId}`,
    },
  });
}

test("reads the active access-control definition from the canonical key", async () => {
  const reads: Record<string, unknown>[] = [];
  const provider = createProvider(
    createDatabase(async (input) => {
      reads.push(input);
      return {
        ok: true,
        body: {
          item: {
            state: { definition: DEFINITION, roleCounters: {}, revision: 1 },
          },
        },
      };
    }),
  );

  assert.equal(
    (await provider.repository.getAccessControlState())?.definition,
    DEFINITION,
  );
  assert.deepEqual(
    reads.map((input) => input.key),
    [CANONICAL_KEY],
  );
});

test("returns null when the canonical definition read fails", async () => {
  let readCount = 0;
  const provider = createProvider(
    createDatabase(async () => {
      readCount += 1;
      return { ok: false };
    }),
  );

  assert.equal(await provider.repository.getAccessControlState(), null);
  assert.equal(readCount, 1);
});

test("returns null when the canonical item has no definition", async () => {
  let readCount = 0;
  const provider = createProvider(
    createDatabase(async () => {
      readCount += 1;
      return { ok: true, body: { item: {} } };
    }),
  );

  assert.equal(await provider.repository.getAccessControlState(), null);
  assert.equal(readCount, 1);
});

test("writes the active access-control state with an optimistic revision", async () => {
  const transactions: Record<string, unknown>[] = [];
  const provider = createProvider(
    createDatabase(
      async () => ({ ok: true, body: { item: undefined } }),
      async () => ({ ok: true }),
      async (input) => {
        transactions.push(input);
        return { ok: true };
      },
    ),
  );

  await provider.repository.saveAccessControlState(
    { definition: DEFINITION, roleCounters: {}, revision: 1 },
    0,
  );

  assert.equal(transactions.length, 1);
  const item = (transactions[0]?.items as any[])?.[0];
  assert.deepEqual(item?.key, CANONICAL_KEY);
  assert.deepEqual(item?.item?.state, {
    definition: DEFINITION,
    roleCounters: {},
    revision: 1,
  });
  assert.equal(item?.condition?.values[":expectedRevision"], 0);
});

test("surfaces non-concurrency transaction failures when saving state", async () => {
  const provider = createProvider(
    createDatabase(
      async () => ({
        ok: true,
        body: {
          item: {
            state: { definition: DEFINITION, roleCounters: {}, revision: 0 },
          },
        },
      }),
      async () => ({ ok: true }),
      async () => ({
        ok: false,
        body: {
          error: "User is not authorized to perform dynamodb:TransactWriteItems",
          details: { name: "AccessDeniedException" },
        },
      }),
    ),
  );

  await assert.rejects(
    provider.repository.saveAccessControlState(
      { definition: DEFINITION, roleCounters: {}, revision: 1 },
      0,
    ),
    /Failed to save the access-control state: User is not authorized/,
  );
});

test("reports conditional transaction failures as concurrent writes", async () => {
  const currentDefinition: CiAccessControlDefinition = {
    ...DEFINITION,
    domains: [{ id: "current", title: "Current" }],
  };
  const provider = createProvider(
    createDatabase(
      async () => ({
        ok: true,
        body: {
          item: {
            state: {
              definition: currentDefinition,
              roleCounters: {},
              revision: 1,
            },
          },
        },
      }),
      async () => ({ ok: true }),
      async () => ({
        ok: false,
        body: {
          error:
            "Transaction cancelled, please refer cancellation reasons for specific reasons [ConditionalCheckFailed]",
          details: { name: "TransactionCanceledException" },
        },
      }),
    ),
  );

  await assert.rejects(
    provider.repository.saveAccessControlState(
      { definition: DEFINITION, roleCounters: {}, revision: 1 },
      0,
    ),
    /access-control state changed concurrently/,
  );
});

test("initializes a missing definition from configured defaults without overwriting", async () => {
  const definition = ciCreateAppAccessControl();
  const assignment = {
    id: "assignment-1",
    subjectId: "user-1",
    roleId: "user",
    scope: { kind: "system" as const },
    propagation: "exact" as const,
  };
  const writes: Record<string, unknown>[] = [];
  const database: CiAwsEmberguardDatabase = {
    async readItem() {
      return { ok: true, body: { item: undefined } };
    },
    async queryItems(input) {
      assert.equal(input.ConsistentRead, true);
      return { ok: true, body: { items: [assignment] } };
    },
    async writeItem(input) {
      writes.push(input);
      return { ok: true };
    },
    async deleteItem() {
      return { ok: true };
    },
    async transactWrite() {
      return { ok: true };
    },
  };
  const emberguard = new Emberguard(createProvider(database), { definition });

  const initialized = await emberguard.ensureAccessControlState();

  assert.equal(initialized.created, true);
  assert.equal(initialized.state.definition, definition);
  assert.equal(initialized.state.revision, 0);
  assert.deepEqual(
    initialized.state.roleCounters,
    ciBuildSecurityRoleCounters(definition, [assignment]),
  );
  assert.equal(initialized.state.roleCounters.user?.directUserCount, 1);
  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0]?.key, CANONICAL_KEY);
  assert.equal(writes[0]?.existence, "insertOnly");
  assert.equal((writes[0]?.item as any)?.state.definition, definition);
});

test("uses the winner when access-control initialization races", async () => {
  const configuredDefinition = ciCreateAppAccessControl();
  const winningState = {
    definition: DEFINITION,
    roleCounters: {},
    revision: 2,
  };
  let reads = 0;
  const database = createDatabase(
    async () => {
      reads += 1;
      return reads === 1
        ? { ok: true, body: { item: undefined } }
        : { ok: true, body: { item: { state: winningState } } };
    },
    async () => ({ ok: false }),
  );
  const emberguard = new Emberguard(createProvider(database), {
    definition: configuredDefinition,
  });

  const initialized = await emberguard.ensureAccessControlState();

  assert.equal(initialized.created, false);
  assert.deepEqual(initialized.state, winningState);
  assert.equal(reads, 2);
});

test("atomically writes an assignment with its ready role counters", async () => {
  const definition = ciCreateAppAccessControl({
    roles: [
      {
        id: "department-manager",
        title: "Department manager",
        precedence: 40,
        inherits: ["user"],
        privileges: [],
      },
    ],
  });
  const transactions: Record<string, unknown>[] = [];
  const provider = createProvider({
    async readItem() {
      return {
        ok: true,
        body: {
          item: {
            state: {
              definition,
              roleCounters: ciBuildSecurityRoleCounters(definition, []),
              revision: 3,
            },
          },
        },
      };
    },
    async queryItems() {
      return { ok: true, body: { items: [] } };
    },
    async writeItem() {
      return { ok: true };
    },
    async deleteItem() {
      return { ok: true };
    },
    async transactWrite(input) {
      transactions.push(input);
      return { ok: true };
    },
  });
  const emberguard = new Emberguard(provider, { definition });

  await emberguard.putRoleAssignment({
    id: "assignment-1",
    subjectId: "user-1",
    roleId: "department-manager",
    tenantId: "tenant-1",
    scope: { kind: "tenant", tenantId: "tenant-1" },
    propagation: "exact",
  });

  assert.equal(transactions.length, 1);
  const items = transactions[0]?.items as
    | Array<{ mode: string; key: Record<string, unknown>; item?: any }>
    | undefined;
  assert.deepEqual(items?.[0]?.key, {
    PK: "CI#EMBERGUARD#SUBJECT#user-1#ROLE_ASSIGNMENTS",
    SK: "CI#ROLE_ASSIGNMENT#assignment-1",
  });
  assert.deepEqual(items?.[1]?.key, {
    PK: "CI#EMBERGUARD#ROLE_ASSIGNMENTS",
    SK: "CI#TENANT#tenant-1#SUBJECT#user-1#ROLE_ASSIGNMENT#assignment-1",
  });
  assert.deepEqual(items?.[2]?.item?.state.roleCounters["department-manager"], {
    permissionCount: 0,
    directUserCount: 1,
    inheritedUserCount: 0,
  });
  assert.equal(items?.[2]?.item?.state.roleCounters.user.inheritedUserCount, 1);
});

test("queries the strongly consistent assignment projection without a scan or GSI", async () => {
  const queries: Record<string, unknown>[] = [];
  const provider = createProvider({
    async readItem() {
      return { ok: true, body: { item: undefined } };
    },
    async queryItems(input) {
      queries.push(input);
      return { ok: true, body: { items: [] } };
    },
    async writeItem() {
      return { ok: true };
    },
    async deleteItem() {
      return { ok: true };
    },
    async transactWrite() {
      return { ok: true };
    },
  });

  await provider.repository.listRoleAssignments({});
  await provider.repository.listRoleAssignments({ tenantId: "tenant-1" });
  await provider.repository.listRoleAssignments({ subjectId: "user-1" });

  assert.deepEqual(queries[0]?.ExpressionAttributeValues, {
    ":pk": "CI#EMBERGUARD#ROLE_ASSIGNMENTS",
  });
  assert.equal(queries[0]?.IndexName, undefined);
  assert.equal(queries[0]?.ConsistentRead, true);
  assert.equal(
    queries[1]?.KeyConditionExpression,
    "PK = :pk AND begins_with(SK, :tenant)",
  );
  assert.deepEqual(queries[1]?.ExpressionAttributeValues, {
    ":pk": "CI#EMBERGUARD#ROLE_ASSIGNMENTS",
    ":tenant": "CI#TENANT#tenant-1",
  });
  assert.deepEqual(queries[2]?.ExpressionAttributeValues, {
    ":pk": "CI#EMBERGUARD#SUBJECT#user-1#ROLE_ASSIGNMENTS",
  });
  assert.equal(queries[2]?.ConsistentRead, true);
});

test("atomically deletes an assignment with its updated role counters", async () => {
  const definition = ciCreateAppAccessControl();
  const assignment = {
    id: "assignment-1",
    subjectId: "user-1",
    roleId: "user",
    scope: { kind: "tenant" as const, tenantId: "tenant-1" },
    tenantId: "tenant-1",
    propagation: "exact" as const,
  };
  const transactions: Record<string, unknown>[] = [];
  const provider = createProvider({
    async readItem() {
      return {
        ok: true,
        body: {
          item: {
            state: {
              definition,
              roleCounters: ciBuildSecurityRoleCounters(definition, [
                assignment,
              ]),
              revision: 4,
            },
          },
        },
      };
    },
    async queryItems() {
      return {
        ok: true,
        body: {
          items: [
            {
              ...assignment,
              PK: "CI#EMBERGUARD#ROLE_ASSIGNMENTS",
              SK: "CI#TENANT#tenant-1#SUBJECT#user-1#ROLE_ASSIGNMENT#assignment-1",
              type: "ROLE_ASSIGNMENT",
              updatedAt: "2026-08-13T12:00:00.000Z",
            },
          ],
        },
      };
    },
    async writeItem() {
      return { ok: true };
    },
    async deleteItem() {
      return { ok: true };
    },
    async transactWrite(input) {
      transactions.push(input);
      return { ok: true };
    },
  });
  const emberguard = new Emberguard(provider, { definition });

  await emberguard.deleteRoleAssignment({
    id: assignment.id,
    subjectId: assignment.subjectId,
  });

  const items = transactions[0]?.items as
    | Array<{ mode: string; key: Record<string, unknown>; item?: any }>
    | undefined;
  assert.equal(items?.[0]?.mode, "delete");
  assert.equal(items?.[1]?.mode, "delete");
  assert.deepEqual(items?.[2]?.item?.state.roleCounters.user, {
    permissionCount: definition.roles.find((role) => role.id === "user")
      ?.privileges.length,
    directUserCount: 0,
    inheritedUserCount: 0,
  });
});

test("rebuilds inherited counters when saving a definition after role deletion", async () => {
  const definition = ciCreateAppAccessControl({
    roles: [
      {
        id: "department-manager",
        title: "Department manager",
        precedence: 40,
        inherits: ["user"],
        privileges: [],
      },
    ],
  });
  const assignment = {
    id: "assignment-1",
    subjectId: "user-1",
    roleId: "department-manager",
    scope: { kind: "tenant" as const, tenantId: "tenant-1" },
    tenantId: "tenant-1",
    propagation: "exact" as const,
  };
  const transactions: Record<string, unknown>[] = [];
  const provider = createProvider({
    async readItem() {
      return {
        ok: true,
        body: {
          item: {
            state: {
              definition,
              roleCounters: ciBuildSecurityRoleCounters(definition, [
                assignment,
              ]),
              revision: 6,
            },
          },
        },
      };
    },
    async queryItems() {
      return {
        ok: true,
        body: {
          items: [
            {
              ...assignment,
              PK: "CI#EMBERGUARD#ROLE_ASSIGNMENTS",
              SK: "CI#TENANT#tenant-1#SUBJECT#user-1#ROLE_ASSIGNMENT#assignment-1",
              type: "ROLE_ASSIGNMENT",
              updatedAt: "2026-08-13T12:00:00.000Z",
            },
          ],
        },
      };
    },
    async writeItem() {
      return { ok: true };
    },
    async deleteItem() {
      return { ok: true };
    },
    async transactWrite(input) {
      transactions.push(input);
      return { ok: true };
    },
  });
  const emberguard = new Emberguard(provider, { definition });
  const withoutManager = {
    ...definition,
    roles: definition.roles.filter((role) => role.id !== "department-manager"),
  };

  await emberguard.saveDefinition(withoutManager);

  const state = (transactions[0]?.items as any[])?.[0]?.item?.state;
  assert.equal(state?.roleCounters.user.inheritedUserCount, 0);
  assert.equal(state?.roleCounters["department-manager"], undefined);
  assert.equal(state?.revision, 7);
});

test("includes the database error when an assignment query fails", async () => {
  const provider = createProvider({
    ...createDatabase(async () => ({ ok: true, body: { item: undefined } })),
    async queryItems() {
      return {
        ok: false,
        body: {
          error: "AccessDeniedException: dynamodb:Query is not authorized",
        },
      };
    },
  });

  await assert.rejects(
    provider.repository.listRoleAssignments({}),
    /AccessDeniedException: dynamodb:Query is not authorized/,
  );
});
