import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  ciCreateCoreSettingsRegistry,
  CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
} from "@cloudigniter/core/lib";
import {
  ciCreateAwsSettingsStore,
  ciSettingsRecordKey,
} from "../../src/server/backend/handlers/settings-handlers/ci-settings-store";
import { ciCreateAwsSettingsHandlers } from "../../src/server/backend/handlers/settings-handlers/ci-settings-handlers";
import { ciSettingsTargets } from "../../src/server/backend/handlers/settings-handlers/ci-settings-targets";
import { ciMakeSystemTablePolicies } from "../../src/server/backend/resources/data/system-table/policy";
import { ciMakePublicSettingsTablePolicies } from "../../src/server/backend/resources/data/public-settings-table/policy";
import type {
  CiRoleDefinition,
  CiSettingsGroup,
} from "@cloudigniter/core/types";
import type { CiAppSyncResolverEvent } from "../../src/types";

const publicKey = {
  settingsId: "public.general",
  scope: "public" as const,
  targetTenantScope: "system" as const,
};
function client() {
  return DynamoDBDocumentClient.from(
    new DynamoDBClient({ region: "us-east-1" }),
  );
}
const tables = { public: "public", private: "private", user: "user" };
function event(
  input: unknown,
  sub?: string,
  groups: string[] = [],
): CiAppSyncResolverEvent {
  return {
    source: null,
    request: { headers: {}, domainName: null },
    info: {
      fieldName: "GetSettings",
      parentTypeName: "Query",
      variables: {},
      selectionSetList: [],
      selectionSetGraphQL: "",
    },
    prev: null,
    stash: {},
    arguments: { inputString: JSON.stringify(input) },
    identity: sub
      ? {
          sub,
          issuer: "https://identity.example.test",
          claims: { sub, "cognito:groups": groups },
        }
      : null,
  };
}
function handlers() {
  process.env.CI_PUBLIC_SETTINGS_TABLE = "public";
  process.env.CI_SYSTEM_TABLE = "system";
  process.env.CI_PRIVATE_SETTINGS_TABLE = "private";
  process.env.CI_USER_SETTINGS_TABLE = "user";
  process.env.CI_EMBERGUARD_ACCESS_TABLE = "access";
  const db = client();
  const items = new Map<string, Record<string, unknown>>();
  const calls: (
    GetCommand | PutCommand | QueryCommand | TransactWriteCommand
  )[] = [];
  mock.method(
    db,
    "send",
    async (
      command: GetCommand | PutCommand | QueryCommand | TransactWriteCommand,
    ) => {
      calls.push(command);
      if (command instanceof QueryCommand) {
        if (command.input.IndexName === "GSI1")
          return {
            Items: [...items.values()].filter((item) => item.type === "TENANT"),
          };
        return {
          Items: [...items.values()].filter(
            (item) =>
              item.PK === command.input.ExpressionAttributeValues?.[":pk"],
          ),
        };
      }
      if (command instanceof GetCommand)
        return {
          Item: items.get(
            JSON.stringify([command.input.TableName, command.input.Key]),
          ),
        };
      if (command instanceof TransactWriteCommand) {
        const actions = command.input.TransactItems!;
        const puts = actions.flatMap((item) => (item.Put ? [item.Put] : []));
        const reasons = actions.map((action) => {
          const operation = action.Put ?? action.ConditionCheck!;
          const key = action.Put
            ? { PK: action.Put.Item!.PK, SK: action.Put.Item!.SK }
            : action.ConditionCheck!.Key;
          const current = items.get(JSON.stringify([operation.TableName, key]));
          const valid =
            operation.ConditionExpression === "attribute_not_exists(PK)"
              ? !current
              : current?.revision ===
                operation.ExpressionAttributeValues?.[":expected"];
          return { Code: valid ? "None" : "ConditionalCheckFailed" };
        });
        if (reasons.some((reason) => reason.Code !== "None"))
          throw Object.assign(new Error("Transaction conflict"), {
            name: "TransactionCanceledException",
            CancellationReasons: reasons,
          });
        for (const put of puts)
          items.set(
            JSON.stringify([
              put.TableName,
              { PK: put.Item!.PK, SK: put.Item!.SK },
            ]),
            put.Item!,
          );
        return {};
      }
      const { Item, TableName } = command.input;
      if (Item)
        items.set(
          JSON.stringify([TableName, { PK: Item.PK, SK: Item.SK }]),
          Item,
        );
      return {};
    },
  );
  return {
    calls,
    items,
    api: ciCreateAwsSettingsHandlers({
      registry: ciCreateCoreSettingsRegistry(),
      client: db,
    }),
  };
}
test("settings keys encode category and authenticated owner with the canonical prefix", () => {
  assert.deepEqual(ciSettingsRecordKey(publicKey), {
    PK: "CI#SETTINGS#SYSTEM#PUBLIC",
    SK: "CI#GROUP#public.general",
  });
  assert.deepEqual(ciSettingsRecordKey({ ...publicKey, scope: "private" }), {
    PK: "CI#SETTINGS#SYSTEM#PRIVATE",
    SK: "CI#GROUP#public.general",
  });
  assert.deepEqual(
    ciSettingsRecordKey({ ...publicKey, scope: "user", userId: "alice" }),
    { PK: "CI#SETTINGS#USER#alice", SK: "CI#GROUP#public.general" },
  );
  assert.throws(
    () => ciSettingsRecordKey({ ...publicKey, scope: "user" }),
    /owner/,
  );
  assert.throws(
    () => ciSettingsRecordKey({ ...publicKey, tenantId: "tenant" }),
    /Invalid settings target/,
  );
});
test("settings writes use conditional revisions and surface conflicts", async () => {
  const db = client();
  const send = mock.method(db, "send", async () => ({}));
  const store = ciCreateAwsSettingsStore({ client: db, tables });
  await store.set({
    ...publicKey,
    value: { applicationName: "Example" },
    expectedRevision: 0,
  });
  assert.equal(
    (send.mock.calls[0]?.arguments[0] as PutCommand).input.ConditionExpression,
    "attribute_not_exists(PK)",
  );
  await store.set({
    ...publicKey,
    value: { applicationName: "Updated" },
    expectedRevision: 2,
  });
  const update = send.mock.calls[1]?.arguments[0] as PutCommand;
  assert.equal(update.input.ConditionExpression, "#revision = :expected");
  assert.equal(update.input.Item?.revision, 3);
  send.mock.mockImplementation(async () => {
    throw Object.assign(new Error("conflict"), {
      name: "ConditionalCheckFailedException",
    });
  });
  await assert.rejects(
    store.set({ ...publicKey, value: {}, expectedRevision: 1 }),
    /Reload before saving/,
  );
});
test("backend serves anonymous public reads but denies private, personal, and writes", async () => {
  const { api, calls } = handlers();
  assert.equal((await api.get(event({ id: "public.general" }))).ok, true);
  const count = calls.length;
  assert.equal((await api.get(event({ id: "private.email" }))).ok, false);
  assert.equal((await api.get(event({ id: "user.preferences" }))).ok, false);
  assert.equal(
    (
      await api.set(
        event({
          id: "public.general",
          value: { applicationName: "Changed" },
          revision: 0,
        }),
      )
    ).ok,
    false,
  );
  assert.equal(calls.length, count);
});
test("backend rejects owner spoofing and restricts ordinary users to their own writes", async () => {
  const { api, calls } = handlers();
  assert.equal(
    (await api.get(event({ id: "user.preferences", userId: "bob" }, "alice")))
      .ok,
    false,
  );
  assert.equal(calls.length, 0);
  assert.equal(
    (
      await api.set(
        event(
          {
            id: "public.general",
            value: { applicationName: "Changed" },
            revision: 0,
          },
          "alice",
          ["user"],
        ),
      )
    ).ok,
    false,
  );
  assert.equal(calls.filter((item) => item instanceof PutCommand).length, 0);
  const saved = await api.set(
    event(
      {
        id: "user.preferences",
        value: {
          locale: "ar",
          theme: "dark",
          timeZone: "UTC",
          timeFormat: "24h",
        },
        revision: 0,
      },
      "alice",
      ["user"],
    ),
  );
  assert.equal(saved.ok, true);
  const put = calls.find((item) => item instanceof PutCommand) as PutCommand;
  assert.equal(put.input.TableName, "user");
  assert.equal(put.input.Item?.PK, "CI#SETTINGS#USER#alice");
});
test("both default system administrator roles can update application settings", async () => {
  for (const role of ["system-admin", "system-super-admin"]) {
    const { api, calls } = handlers();
    assert.equal(
      (
        await api.set(
          event(
            {
              id: "public.general",
              value: { applicationName: "Updated" },
              revision: 0,
            },
            "admin",
            [role],
          ),
        )
      ).ok,
      true,
      role,
    );
    assert.equal(calls.filter((item) => item instanceof PutCommand).length, 1);
    assert.equal(
      (calls.find((item) => item instanceof GetCommand) as GetCommand).input
        .ConsistentRead,
      true,
    );
  }
});

test("a custom settings role receives capabilities without administrator groups, and explicit denies still apply", async () => {
  const { api, items, calls } = handlers();
  const definition = {
    ...CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
    roles: [
      ...CI_DEFAULT_ACCESS_CONTROL_DEFINITION.roles,
      {
        id: "settings-manager",
        title: "Settings manager",
        precedence: 200,
        privileges: [
          {
            id: "manage-settings",
            title: "Manage settings",
            effect: "allow",
            resource: "platform.settings",
            action: "*",
            scopeKinds: ["system"],
          },
        ],
      },
    ],
  };
  items.set(
    JSON.stringify([
      "access",
      { PK: "CI#EMBERGUARD#ACCESS_CONTROL", SK: "CI#DEFINITION#ACTIVE" },
    ]),
    { state: { definition } },
  );
  const allowed = await api.get(
    event({ access: true }, "custom", ["settings-manager"]),
  );
  assert.deepEqual(allowed.body, {
    read: true,
    update: true,
    enforce: true,
    overwrite: true,
  });
  assert.equal(
    calls.filter((command) => command instanceof PutCommand).length,
    0,
  );
  definition.roles.push({
    id: "settings-blocked",
    title: "Settings blocked",
    precedence: 300,
    privileges: [
      {
        id: "deny-settings-update",
        title: "Deny update",
        effect: "deny",
        resource: "platform.settings",
        action: "update",
        scopeKinds: ["system"],
      },
    ],
  });
  const denied = await api.get(
    event({ access: true }, "custom", ["settings-manager", "settings-blocked"]),
  );
  assert.deepEqual(denied.body, {
    read: true,
    update: false,
    enforce: true,
    overwrite: true,
  });
  assert.equal(
    (
      await api.set(
        event(
          {
            id: "public.general",
            value: { applicationName: "Forbidden" },
            revision: 0,
          },
          "custom",
          ["settings-manager", "settings-blocked"],
        ),
      )
    ).ok,
    false,
  );
  assert.equal(
    calls.filter((command) => command instanceof PutCommand).length,
    0,
  );
  assert.equal(
    (await api.get(event({ access: true, userId: "someone-else" }, "custom")))
      .ok,
    false,
  );
});

test("one Save persists every category section atomically and a stale section rolls back all changes", async () => {
  const { api, calls, items } = handlers();
  const registry = ciCreateCoreSettingsRegistry();
  const groups = [
    { id: "public.general", value: { applicationName: "First" }, revision: 0 },
    {
      id: "public.preferences",
      value: registry.get("public.preferences").defaults,
      revision: 0,
    },
  ];
  const first = await api.set(event({ groups }, "admin", ["system-admin"]));
  assert.equal(first.ok, true);
  const transaction = calls.find(
    (command) => command instanceof TransactWriteCommand,
  ) as TransactWriteCommand;
  assert.equal(transaction.input.TransactItems?.length, 2);
  assert.equal(transaction.input.ReturnConsumedCapacity, "TOTAL");
  assert.equal(transaction.input.TransactItems?.[0]?.Put?.TableName, "public");
  const before = JSON.stringify([...items.entries()]);
  const stale = await api.set(
    event(
      {
        groups: [
          {
            ...groups[0],
            value: { applicationName: "Must not persist" },
            revision: 1,
          },
          groups[1],
        ],
      },
      "admin",
      ["system-admin"],
    ),
  );
  assert.equal(stale.ok, false);
  assert.match(JSON.stringify(stale.body), /No sections were saved/);
  assert.equal(JSON.stringify([...items.entries()]), before);
  const updated = await api.set(
    event(
      { groups: groups.map((group) => ({ ...group, revision: 1 })) },
      "admin",
      ["system-admin"],
    ),
  );
  assert.equal(updated.ok, true);
});

test("batch requests repeat authorization and reject invalid sections or owner spoofing before writing", async () => {
  const { api, calls } = handlers();
  const value = ciCreateCoreSettingsRegistry().get("user.preferences").defaults;
  const userGroup = { id: "user.preferences", value, revision: 0 };
  for (const input of [
    { groups: [userGroup], userId: "bob" },
    { groups: [{ ...userGroup, userId: "bob" }] },
    { groups: [userGroup, { id: "private.email", value: {}, revision: 0 }] },
    { groups: [userGroup, userGroup] },
    { groups: [] },
  ])
    assert.equal((await api.set(event(input, "alice", ["user"]))).ok, false);
  assert.equal((await api.set(event({ groups: [userGroup] }))).ok, false);
  assert.equal(
    (
      await api.set(
        event(
          {
            groups: [
              {
                id: "public.general",
                value: { applicationName: "Denied" },
                revision: 0,
              },
            ],
          },
          "alice",
          ["user"],
        ),
      )
    ).ok,
    false,
  );
  assert.equal(
    calls.filter((command) => command instanceof TransactWriteCommand).length,
    0,
  );
  assert.equal(
    (await api.set(event({ groups: [userGroup] }, "alice", ["user"]))).ok,
    true,
  );
  const transaction = calls.find(
    (command) => command instanceof TransactWriteCommand,
  ) as TransactWriteCommand;
  assert.equal(
    transaction.input.TransactItems?.[0]?.Put?.Item?.PK,
    "CI#SETTINGS#USER#alice",
  );
});

test("batch storage rejects more than 100 groups before sending a transaction", async () => {
  const db = client();
  const send = mock.method(db, "send", async () => ({}));
  const store = ciCreateAwsSettingsStore({ client: db, tables });
  await assert.rejects(
    store.setMany!(
      Array.from({ length: 101 }, (_, index) => ({
        ...publicKey,
        settingsId: `group${index}`,
        value: {},
        expectedRevision: 0,
      })),
    ),
    /100/,
  );
  assert.equal(send.mock.callCount(), 0);
});

test("both administrator roles can save the whole Private form and invalid sections never reach storage", async () => {
  for (const role of ["system-admin", "system-super-admin"]) {
    const { api, calls } = handlers();
    const registry = ciCreateCoreSettingsRegistry();
    const group = {
      id: "private.email",
      value: registry.get("private.email").defaults,
      revision: 0,
    };
    assert.equal(
      (await api.set(event({ groups: [group] }, "admin", [role]))).ok,
      true,
    );
    const transaction = calls.find(
      (command) => command instanceof TransactWriteCommand,
    ) as TransactWriteCommand;
    assert.equal(
      transaction.input.TransactItems?.[0]?.Put?.TableName,
      "private",
    );
    const count = calls.filter(
      (command) => command instanceof TransactWriteCommand,
    ).length;
    assert.equal(
      (
        await api.set(
          event(
            { groups: [{ ...group, value: { unknown: true }, revision: 1 }] },
            "admin",
            [role],
          ),
        )
      ).ok,
      false,
    );
    assert.equal(
      calls.filter((command) => command instanceof TransactWriteCommand).length,
      count,
    );
  }
});

test("forced read-only settings permission preserves reads and prevents any persisted update", async () => {
  const { api, items, calls } = handlers();
  const definition = {
    ...CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
    roles: [
      ...CI_DEFAULT_ACCESS_CONTROL_DEFINITION.roles,
      {
        id: "settings-auditor",
        title: "Settings auditor",
        precedence: 900,
        privileges: [
          {
            id: "audit-settings",
            title: "Audit settings",
            effect: "allow",
            resource: "platform.settings",
            action: "read",
            scopeKinds: ["system"],
            readOnly: true,
          },
        ],
      },
    ],
  };
  items.set(
    JSON.stringify([
      "access",
      { PK: "CI#EMBERGUARD#ACCESS_CONTROL", SK: "CI#DEFINITION#ACTIVE" },
    ]),
    { state: { definition } },
  );
  const groups = ["system-super-admin", "settings-auditor"];
  const access = await api.get(event({ access: true }, "admin", groups));
  assert.deepEqual(access.body, {
    read: true,
    update: false,
    enforce: false,
    overwrite: false,
  });
  const result = await api.set(
    event(
      {
        id: "public.general",
        value: { applicationName: "Forbidden" },
        revision: 0,
      },
      "admin",
      groups,
    ),
  );
  assert.equal(result.ok, false);
  assert.equal(
    calls.some(
      (command) =>
        command instanceof PutCommand ||
        command instanceof TransactWriteCommand,
    ),
    false,
  );
});

function addTenant(
  items: Map<string, Record<string, unknown>>,
  id: string,
  status = "active",
) {
  const record = {
    PK: `CI#SYSTEM#TENANT#${id}`,
    SK: "CI#META",
    tenantId: id,
    name: `Tenant ${id}`,
    type: "TENANT",
    status,
    deletionState: "active",
  };
  items.set(
    JSON.stringify(["system", { PK: record.PK, SK: record.SK }]),
    record,
  );
}
const tenantTarget = { scope: "tenant", tenantId: "A" } as const;

test("GLOBAL and tenant keys cannot alias System or another tenant", () => {
  assert.deepEqual(
    ciSettingsRecordKey({ ...publicKey, targetTenantScope: "global" }),
    { PK: "CI#SETTINGS#GLOBAL#PUBLIC", SK: "CI#GROUP#public.general" },
  );
  assert.deepEqual(
    ciSettingsRecordKey({
      ...publicKey,
      targetTenantScope: "tenant",
      tenantId: "A",
    }),
    { PK: "CI#SETTINGS#TENANT#A#PUBLIC", SK: "CI#GROUP#public.general" },
  );
  assert.throws(
    () => ciSettingsRecordKey({ ...publicKey, targetTenantScope: "tenant" }),
    /target/,
  );
});

test("provider creates one isolated tenant snapshot, rechecks existence strongly, and rejects unavailable targets", async () => {
  const { api, items, calls } = handlers();
  addTenant(items, "A");
  addTenant(items, "suspended", "suspended");
  const read = await api.get(
    event({ id: "public.general", target: tenantTarget }),
  );
  assert.equal(read.ok, true);
  assert.equal(
    calls.filter((call) => call instanceof TransactWriteCommand).length,
    1,
  );
  await api.get(event({ id: "public.general", target: tenantTarget }));
  assert.equal(
    calls.filter((call) => call instanceof TransactWriteCommand).length,
    1,
  );
  assert.ok(
    calls
      .filter(
        (call) =>
          call instanceof GetCommand && call.input.TableName === "system",
      )
      .every((call) => (call as GetCommand).input.ConsistentRead),
  );
  for (const tenantId of ["missing", "suspended"])
    assert.equal(
      (
        await api.get(
          event({
            id: "public.general",
            target: { scope: "tenant", tenantId },
          }),
        )
      ).ok,
      false,
    );
});

test("default administrators can manage tenant copies, enforce from System, and removal restores local data", async () => {
  for (const role of ["system-admin", "system-super-admin"]) {
    const { api, items } = handlers();
    addTenant(items, "A");
    const invoke = (input: unknown) => api.set(event(input, "admin", [role]));
    const initial = await api.get(
      event({ id: "public.general", target: tenantTarget }),
    );
    assert.equal(initial.ok, true);
    assert.equal(
      (
        await invoke({
          target: tenantTarget,
          groups: [
            {
              id: "public.general",
              value: { applicationName: "Local" },
              revision: 1,
              systemRevision: 0,
            },
          ],
        })
      ).ok,
      true,
    );
    assert.equal(
      (
        await invoke({
          groups: [
            {
              id: "public.general",
              value: { applicationName: "Forced" },
              revision: 0,
              enforcement: [{ fields: "*", targets: "*" }],
            },
          ],
        })
      ).ok,
      true,
    );
    const forced = await api.get(
      event({ id: "public.general", target: tenantTarget }),
    );
    assert.equal(
      (forced.body as CiSettingsGroup).value.applicationName,
      "Forced",
    );
    assert.equal(
      (
        await invoke({
          target: tenantTarget,
          groups: [
            {
              id: "public.general",
              value: { applicationName: "Bypass" },
              revision: 2,
              systemRevision: 1,
            },
          ],
        })
      ).ok,
      false,
    );
    assert.equal(
      (
        await invoke({
          groups: [
            {
              id: "public.general",
              value: { applicationName: "Primary" },
              revision: 1,
              enforcement: [],
            },
          ],
        })
      ).ok,
      true,
    );
    const restored = await api.get(
      event({ id: "public.general", target: tenantTarget }),
    );
    assert.equal(
      (restored.body as CiSettingsGroup).value.applicationName,
      "Local",
    );
  }
});

test("source revision conditions cancel every target write if enforcement changes concurrently", async () => {
  const db = client();
  const send = mock.method(
    db,
    "send",
    async (command: TransactWriteCommand) => {
      assert.equal(command.input.TransactItems?.length, 3);
      assert.deepEqual(command.input.TransactItems?.[0]?.ConditionCheck?.Key, {
        PK: "CI#SETTINGS#SYSTEM#PUBLIC",
        SK: "CI#GROUP#public.general",
      });
      throw Object.assign(new Error("conflict"), {
        name: "TransactionCanceledException",
        CancellationReasons: [{ Code: "ConditionalCheckFailed" }],
      });
    },
  );
  const store = ciCreateAwsSettingsStore({ client: db, tables });
  await assert.rejects(
    store.setMany!(
      [
        {
          ...publicKey,
          targetTenantScope: "tenant",
          tenantId: "A",
          expectedRevision: 1,
          value: { applicationName: "A" },
        },
        {
          ...publicKey,
          settingsId: "public.preferences",
          targetTenantScope: "tenant",
          tenantId: "A",
          expectedRevision: 1,
          value: {},
        },
      ],
      [{ ...publicKey, revision: 2 }],
    ),
    /No sections were saved/,
  );
  assert.equal(send.mock.callCount(), 1);
});

test("tenant-scoped assignments cannot write another tenant or install System rules", async () => {
  const { api, items } = handlers();
  addTenant(items, "A");
  addTenant(items, "B");
  const definition = {
    ...structuredClone(CI_DEFAULT_ACCESS_CONTROL_DEFINITION),
    roles: [
      ...CI_DEFAULT_ACCESS_CONTROL_DEFINITION.roles,
    ] as CiRoleDefinition[],
  };
  definition.roles.push({
    id: "tenant-settings-editor",
    title: "Tenant settings editor",
    precedence: 200,
    privileges: [
      {
        id: "edit-tenant-settings",
        title: "Edit tenant settings",
        resource: "platform.settings",
        action: "*",
        effect: "allow",
        scopeKinds: ["tenant"],
      },
    ],
  });
  items.set(
    JSON.stringify([
      "access",
      { PK: "CI#EMBERGUARD#ACCESS_CONTROL", SK: "CI#DEFINITION#ACTIVE" },
    ]),
    { state: { definition } },
  );
  const assignment = {
    PK: "CI#EMBERGUARD#SUBJECT#editor#ROLE_ASSIGNMENTS",
    SK: "assignment",
    subjectId: "editor",
    roleId: "tenant-settings-editor",
    scope: { kind: "tenant", tenantId: "A" },
    propagation: "exact",
  };
  items.set("assignment", assignment);
  const check = await api.get(
    event({ access: true, target: tenantTarget }, "editor"),
  );
  assert.equal(check.ok, true, JSON.stringify(check.body));
  const allowed = await api.get(
    event({ access: true, target: tenantTarget }, "editor"),
  );
  assert.equal((allowed.body as { update: boolean }).update, true);
  const denied = await api.get(
    event(
      { access: true, target: { scope: "tenant", tenantId: "B" } },
      "editor",
    ),
  );
  assert.equal((denied.body as { update: boolean }).update, false);
  assert.equal(
    (
      await api.set(
        event(
          {
            id: "public.general",
            value: { applicationName: "No" },
            revision: 0,
            enforcement: [{ fields: "*", targets: "*" }],
          },
          "editor",
        ),
      )
    ).ok,
    false,
  );
});

test("tenant discovery and enforcement metadata require management access", async () => {
  const { api, items } = handlers();
  addTenant(items, "A");
  assert.equal(
    (await api.get(event({ targets: true }, "user", ["user"]))).ok,
    false,
  );
  const list = await api.get(
    event({ targets: true }, "admin", ["system-admin"]),
  );
  assert.equal(list.ok, true);
  assert.equal((list.body as { items: unknown[] }).items.length, 2);
  await api.set(
    event(
      {
        id: "public.general",
        value: { applicationName: "System" },
        revision: 0,
        enforcement: [{ fields: "*", targets: [tenantTarget] }],
      },
      "admin",
      ["system-admin"],
    ),
  );
  const publicRead = await api.get(event({ id: "public.general" }));
  assert.equal(Object.hasOwn(publicRead.body!, "enforcement"), false);
  assert.equal(
    (
      await api.get(
        event({ id: "public.general", manage: true }, "user", ["user"]),
      )
    ).ok,
    false,
  );
});

test("System administration respects explicit tenant denies and forced read-only grants", async () => {
  for (const readOnly of [false, true]) {
    const { api, items } = handlers();
    addTenant(items, "A");
    const definition = {
      ...structuredClone(CI_DEFAULT_ACCESS_CONTROL_DEFINITION),
      roles: [
        ...CI_DEFAULT_ACCESS_CONTROL_DEFINITION.roles,
      ] as CiRoleDefinition[],
    };
    definition.roles.push({
      id: "tenant-restriction",
      title: "Tenant restriction",
      precedence: 900,
      privileges: [
        {
          id: "restrict-settings",
          title: "Restrict settings",
          resource: "platform.settings",
          action: readOnly ? "read" : "*",
          effect: readOnly ? "allow" : "deny",
          scopeKinds: ["tenant"],
          ...(readOnly ? { readOnly: true } : {}),
        },
      ],
    });
    items.set(
      JSON.stringify([
        "access",
        { PK: "CI#EMBERGUARD#ACCESS_CONTROL", SK: "CI#DEFINITION#ACTIVE" },
      ]),
      { state: { definition } },
    );
    items.set("assignment", {
      PK: "CI#EMBERGUARD#SUBJECT#admin#ROLE_ASSIGNMENTS",
      SK: "assignment",
      subjectId: "admin",
      roleId: "tenant-restriction",
      scope: { kind: "tenant", tenantId: "A" },
      propagation: "exact",
    });
    const result = await api.get(
      event({ access: true, target: tenantTarget }, "admin", [
        "system-super-admin",
      ]),
    );
    assert.deepEqual(result.body, {
      read: readOnly,
      update: false,
      enforce: false,
      overwrite: false,
    });
    assert.equal(
      (
        await api.set(
          event(
            {
              target: tenantTarget,
              overwrite: [
                { id: "public.general", fields: "*", systemRevision: 0 },
              ],
            },
            "admin",
            ["system-super-admin"],
          ),
        )
      ).ok,
      false,
    );
  }
});

test("concurrent initialization returns the winning local copy without overwriting it", async () => {
  const db = client();
  const winner = {
    value: { applicationName: "Concurrent local value" },
    revision: 2,
  };
  const send = mock.method(
    db,
    "send",
    async (command: GetCommand | TransactWriteCommand) => {
      if (command instanceof TransactWriteCommand)
        throw Object.assign(new Error("conflict"), {
          name: "TransactionCanceledException",
          CancellationReasons: [
            { Code: "None" },
            { Code: "ConditionalCheckFailed" },
          ],
        });
      assert.equal(command.input.ConsistentRead, true);
      return { Item: winner };
    },
  );
  const store = ciCreateAwsSettingsStore({ client: db, tables });
  const result = await store.initialize!(
    {
      ...publicKey,
      targetTenantScope: "global",
      value: { applicationName: "Seed" },
      expectedRevision: 0,
    },
    { ...publicKey, revision: 0 },
  );
  assert.deepEqual(result.value, winner.value);
  assert.equal(result.revision, 2);
  assert.equal(send.mock.callCount(), 2);
});

test("tenant discovery round-trips bounded cursors and filters inactive and System records", async () => {
  const db = client();
  const cursor = {
    PK: "CI#SYSTEM#TENANT#A",
    SK: "CI#META",
    GSI1PK: "CI#SYSTEM#TENANTS",
    GSI1SK: "CI#ACTIVE#2026#TENANT#A",
  };
  const send = mock.method(db, "send", async (command: QueryCommand) => {
    assert.equal(command.input.IndexName, "GSI1");
    assert.equal(command.input.Limit, 50);
    if (command.input.ExclusiveStartKey) {
      assert.deepEqual(command.input.ExclusiveStartKey, cursor);
      return { Items: [{ tenantId: "B", name: "Beta", status: "active" }] };
    }
    return {
      Items: [
        { tenantId: "A", name: "Alpha", status: "active" },
        { tenantId: "suspended", status: "suspended" },
        { tenantId: "deleted", status: "active", deletionState: "deleted" },
        { tenantId: "system", status: "active", data: { isSystem: true } },
      ],
      LastEvaluatedKey: cursor,
    };
  });
  const targets = ciSettingsTargets(db, "system");
  const first = await targets.list();
  assert.deepEqual(
    first.items.map((item) => item.label),
    ["GLOBAL", "Alpha"],
  );
  assert.deepEqual(
    (await targets.list(first.nextToken)).items.map((item) => item.label),
    ["Beta"],
  );
  await assert.rejects(
    targets.list(
      Buffer.from(JSON.stringify({ ...cursor, GSI1PK: "CI#OTHER" })).toString(
        "base64url",
      ),
    ),
    /continuation/,
  );
  assert.equal(send.mock.callCount(), 2);
});

test("settings tenant IAM scopes discovery to the exact index and grants conditional snapshot writes", () => {
  const resource = {
    name: "system",
    arn: "arn:aws:dynamodb:us-east-1:123456789012:table/system",
  };
  const options = { includeDefaultDynamoPolicies: true };
  const policies = ciMakeSystemTablePolicies(
    { system: resource },
    options,
  ).inlinePolicies!.filter((policy) => policy.id === "SettingsTenantLookup");
  assert.equal(policies.length, 2);
  for (const policy of policies) {
    assert.deepEqual(policy.statements[0], {
      effect: "Allow",
      actions: ["dynamodb:GetItem"],
      resources: [resource.arn],
    });
    assert.equal(
      policy.statements.length,
      policy.for === "ciGetSettingsHandler" ? 2 : 1,
    );
    if (policy.for === "ciGetSettingsHandler")
      assert.deepEqual(policy.statements[1], {
        effect: "Allow",
        actions: ["dynamodb:Query"],
        resources: [`${resource.arn}/index/GSI1`],
      });
  }
  const categoryPolicies = ciMakePublicSettingsTablePolicies(
    { publicSettings: resource },
    options,
  ).inlinePolicies!;
  assert.equal(categoryPolicies.length, 2);
  assert.ok(
    categoryPolicies.every(
      (policy) =>
        policy.statements[0]?.actions.includes("dynamodb:ConditionCheckItem") &&
        policy.statements[0]?.actions.includes("dynamodb:PutItem"),
    ),
  );
});
