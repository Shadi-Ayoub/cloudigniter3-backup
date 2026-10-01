import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import {
  ciCreateSettingsManager,
  ciDefineSettingsRegistry,
  ciParseSettingsTarget,
} from "../../src/lib/settings";
import type {
  CiSettingsStore,
  CiSettingsRecord,
  CiSettingsTarget,
  CiSettingsManagementAction,
  CiSettings,
  CiSettingsStoreGetInput,
} from "../../src/types";

const registry = ciDefineSettingsRegistry({
  "public.brand": {
    scope: "public",
    defaults: { title: "Primary", color: "blue" },
    schema: z.strictObject({ title: z.string().min(1), color: z.string() }),
    fields: [
      { name: "title", type: { kind: "text" } },
      { name: "color", type: { kind: "text" } },
    ],
  },
  "public.extra": {
    scope: "public",
    defaults: { enabled: true },
    schema: z.strictObject({
      enabled: z.boolean(),
      note: z.string().optional(),
    }),
    fields: [{ name: "note", type: { kind: "text" } }],
  },
  "private.email": {
    scope: "private",
    defaults: { sender: "System" },
    schema: z.strictObject({ sender: z.string() }),
  },
  "user.preferences": {
    scope: "user",
    defaults: { theme: "" },
    schema: z.strictObject({ theme: z.string() }),
  },
});
const tenantA = { scope: "tenant", tenantId: "A" } as const;
const tenantB = { scope: "tenant", tenantId: "B" } as const;
function setup() {
  const records = new Map<string, CiSettingsRecord>();
  const key = (input: Parameters<CiSettingsStore["get"]>[0]) =>
    JSON.stringify([
      input.scope,
      input.targetTenantScope,
      input.tenantId,
      input.userId,
      input.settingsId,
    ]);
  let transactions = 0;
  const store: CiSettingsStore = {
    async get<T extends CiSettings>(input: CiSettingsStoreGetInput) {
      return structuredClone(
        records.get(key(input)) ?? null,
      ) as CiSettingsRecord<T> | null;
    },
    async set(input) {
      const current = records.get(key(input));
      assert.equal(
        current?.revision ?? 0,
        input.expectedRevision,
        "revision conflict",
      );
      const record = { ...input, revision: (input.expectedRevision ?? 0) + 1 };
      records.set(key(input), structuredClone(record));
      return record;
    },
    async initialize(input, source) {
      const existing = records.get(key(input));
      if (existing) return existing;
      assert.equal(records.get(key(source))?.revision ?? 0, source.revision);
      return store.set(input);
    },
    async setMany(inputs, conditions = []) {
      for (const condition of conditions)
        assert.equal(
          records.get(key(condition))?.revision ?? 0,
          condition.revision,
          "System revision conflict",
        );
      for (const input of inputs)
        assert.equal(
          records.get(key(input))?.revision ?? 0,
          input.expectedRevision,
          "Tenant revision conflict",
        );
      transactions++;
      return Promise.all(inputs.map((input) => store.set(input)));
    },
    async delete() {},
  };
  const manager = (
    target: CiSettingsTarget = { scope: "system" },
    allowed: CiSettingsManagementAction[] = [
      "read",
      "update",
      "enforce",
      "overwrite",
    ],
    actor = { id: "admin", authenticated: true },
  ) =>
    ciCreateSettingsManager({
      registry,
      store,
      actor,
      target,
      canManage: (action) => allowed.includes(action),
      validateTarget: async (target) => {
        if (target.scope === "tenant" && !["A", "B"].includes(target.tenantId))
          throw new Error("Unknown tenant");
      },
    });
  const update = async (
    target: CiSettingsTarget,
    value: { title: string; color: string },
  ) => {
    const group = await manager(target).read("public.brand");
    return manager(target).saveAll([
      {
        id: group.id,
        value,
        revision: group.revision,
        systemRevision: group.systemRevision,
      },
    ]);
  };
  return { manager, store, records, update, transactions: () => transactions };
}

test("GLOBAL and each tenant receive isolated, stable copies on first use", async () => {
  const { manager, update, records } = setup();
  const a = manager(tenantA),
    b = manager(tenantB),
    global = manager({ scope: "global" });
  await a.read("public.brand");
  await global.read("public.brand");
  await manager().save(
    "public.brand",
    { title: "New primary", color: "green" },
    0,
  );
  assert.equal((await a.read("public.brand")).value.title, "Primary");
  assert.equal((await global.read("public.brand")).value.title, "Primary");
  assert.equal((await b.read("public.brand")).value.title, "New primary");
  await update(tenantA, { title: "Tenant A", color: "red" });
  assert.equal((await global.read("public.brand")).value.title, "Primary");
  assert.equal(
    (await manager().read("public.brand")).value.title,
    "New primary",
  );
  assert.equal(records.size, 4);
});

test("selected-field enforcement follows System, rejects bypasses, and restores previous local values", async () => {
  const { manager, update } = setup();
  await update(tenantA, { title: "Local A", color: "red" });
  await manager().save("public.brand", { title: "Forced", color: "blue" }, 0, {
    enforcement: [{ fields: ["title"], targets: [tenantA] }],
  });
  const forced = await manager(tenantA).read("public.brand");
  assert.deepEqual(forced.value, { title: "Forced", color: "red" });
  assert.deepEqual(forced.lockedFields, ["title"]);
  await assert.rejects(
    update(tenantA, { title: "Bypass", color: "yellow" }),
    /enforced/,
  );
  await update(tenantA, { title: "Forced", color: "yellow" });
  await manager().save(
    "public.brand",
    { title: "Forced again", color: "green" },
    1,
  );
  assert.equal(
    (await manager(tenantA).read("public.brand")).value.title,
    "Forced again",
  );
  await manager().save(
    "public.brand",
    { title: "Primary", color: "green" },
    2,
    { enforcement: [] },
  );
  assert.deepEqual((await manager(tenantA).read("public.brand")).value, {
    title: "Local A",
    color: "yellow",
  });
});

test("all-tenant enforcement includes GLOBAL and future copies, while selected targets remain isolated", async () => {
  const { manager, update } = setup();
  await update(tenantA, { title: "A", color: "red" });
  await update({ scope: "global" }, { title: "Global", color: "black" });
  await manager().save("public.brand", { title: "Forced", color: "blue" }, 0, {
    enforcement: [{ fields: "*", targets: "*" }],
  });
  for (const target of [tenantA, tenantB, { scope: "global" } as const]) {
    assert.deepEqual((await manager(target).read("public.brand")).value, {
      title: "Forced",
      color: "blue",
    });
  }
  await manager().save("public.brand", { title: "Forced", color: "blue" }, 1, {
    enforcement: [{ fields: "*", targets: [tenantA] }],
  });
  assert.equal(
    (await manager({ scope: "global" }).read("public.brand")).value.title,
    "Global",
  );
});

test("ordinary update permission does not grant enforcement or overwrite, including direct payloads", async () => {
  const { manager, records } = setup();
  await assert.rejects(
    manager({ scope: "system" }, ["read", "update"]).save(
      "public.brand",
      { title: "x", color: "red" },
      0,
      { enforcement: [{ fields: "*", targets: "*" }] },
    ),
    /enforcement permission/,
  );
  await assert.rejects(
    manager(tenantA, ["read", "update"]).overwrite([
      { id: "public.brand", fields: "*", systemRevision: 0 },
    ]),
    /overwrite permission/,
  );
  await assert.rejects(
    manager(tenantA).saveAll([
      {
        id: "public.brand",
        value: { title: "x", color: "red" },
        revision: 0,
        enforcement: [],
      },
    ]),
    /Only System/,
  );
  assert.equal(records.size, 0);
});

test("one-time overwrite copies selected fields only and subsequently permits tenant edits", async () => {
  const { manager, update } = setup();
  await update(tenantA, { title: "A", color: "red" });
  await manager(tenantA).overwrite([
    { id: "public.brand", fields: ["title"], systemRevision: 0 },
  ]);
  assert.deepEqual((await manager(tenantA).read("public.brand")).value, {
    title: "Primary",
    color: "red",
  });
  await update(tenantA, { title: "Independent", color: "red" });
  assert.equal(
    (await manager(tenantA).read("public.brand")).value.title,
    "Independent",
  );
});

test("stale System versions and local revisions reject the complete form before its write", async () => {
  const { manager, update, transactions } = setup();
  await update(tenantA, { title: "A", color: "red" });
  const old = await manager(tenantA).read("public.brand");
  await manager().save("public.brand", { title: "New", color: "green" }, 0);
  const before = transactions();
  await assert.rejects(
    manager(tenantA).saveAll([
      {
        id: old.id,
        value: old.value,
        revision: old.revision,
        systemRevision: old.systemRevision,
      },
    ]),
    /System settings/,
  );
  await assert.rejects(
    manager(tenantA).overwrite([
      { id: old.id, fields: "*", systemRevision: 0 },
    ]),
    /System settings changed/,
  );
  assert.equal(transactions(), before);
  assert.equal((await manager(tenantA).read("public.brand")).value.title, "A");
});

test("request selection, cookie precedence, private authentication and account-wide owner preferences remain intact", async () => {
  const { manager, records } = setup();
  const anonymous = manager(tenantA, [], { id: "", authenticated: false });
  const snapshot = await anonymous.loadRequest([
    "public.brand",
    "private.email",
    "user.preferences",
  ]);
  assert.deepEqual(Object.keys(snapshot), ["public"]);
  assert.equal(records.size, 1);
  await assert.rejects(anonymous.read("private.email"), /Sign in/);
  await manager(tenantA).save("user.preferences", { theme: "dark" }, 0);
  assert.equal(
    (await manager(tenantB).read("user.preferences")).value.theme,
    "dark",
  );
  await assert.rejects(
    manager({ scope: "tenant", tenantId: "unknown" }).read("public.brand"),
    /Unknown tenant/,
  );
});

test("malformed targets and policy field selections fail closed", async () => {
  for (const value of [
    { scope: "system", tenantId: "A" },
    { scope: "tenant" },
    { scope: "tenant", tenantId: "A#B" },
    { scope: "tenant", tenantId: " A" },
    { scope: "other" },
  ])
    assert.throws(() => ciParseSettingsTarget(value));
  const { manager } = setup();
  await assert.rejects(
    manager().save("public.brand", { title: "x", color: "red" }, 0, {
      enforcement: [{ fields: ["missing"], targets: "*" }],
    }),
    /valid/,
  );
});

test("all-field enforcement also clears and locks optional local fields absent from System", async () => {
  const { manager } = setup();
  const local = await manager(tenantA).read("public.extra");
  await manager(tenantA).save(
    "public.extra",
    { enabled: true, note: "Local note" },
    local.revision,
    { systemRevision: 0 },
  );
  await manager().save("public.extra", { enabled: true }, 0, {
    enforcement: [{ fields: "*", targets: "*" }],
  });
  const forced = await manager(tenantA).read("public.extra");
  assert.equal(Object.hasOwn(forced.value, "note"), false);
  assert.ok(forced.lockedFields?.includes("note"));
  await assert.rejects(
    manager(tenantA).save(
      "public.extra",
      { enabled: true, note: "Bypass" },
      forced.revision,
      { systemRevision: forced.systemRevision },
    ),
    /enforced/,
  );
  await manager().save("public.extra", { enabled: true }, 1, {
    enforcement: [],
  });
  assert.equal(
    (await manager(tenantA).read("public.extra")).value.note,
    "Local note",
  );
});
