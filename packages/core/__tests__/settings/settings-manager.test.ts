import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { z } from "zod";
import {
  ciCreateSettingsManager,
  ciCreateCoreSettingsRegistry,
  ciDefineSettingsRegistry,
  ciResolveSettingsPreferences,
} from "../../src/lib/settings";
import type { CiSettingsActor, CiSettingsStore } from "../../src/types";

const registry = ciCreateCoreSettingsRegistry({
  "public.branding": {
    scope: "public",
    defaults: { tagline: "Welcome" },
    schema: z.strictObject({ tagline: z.string().min(1) }),
  },
  "private.operations": { scope: "private", defaults: { active: true } },
  "user.notifications": {
    scope: "user",
    defaults: { email: true },
    schema: z.strictObject({ email: z.boolean() }),
  },
});
function setup(
  actor: CiSettingsActor = { id: null, authenticated: false },
  allowed = false,
) {
  const reads: Parameters<CiSettingsStore["get"]>[0][] = [];
  const writes: Parameters<CiSettingsStore["set"]>[0][] = [];
  const store: CiSettingsStore = {
    async get(input) {
      reads.push(input);
      return null;
    },
    async set(input) {
      writes.push(input);
      return { ...input, revision: (input.expectedRevision ?? 0) + 1 };
    },
    async setMany(inputs) {
      writes.push(...inputs);
      return inputs.map((input) => ({
        ...input,
        revision: (input.expectedRevision ?? 0) + 1,
      }));
    },
    async delete() {},
  };
  const canManage = mock.fn(() => allowed);
  return {
    reads,
    writes,
    store,
    canManage,
    manager: ciCreateSettingsManager({ registry, store, actor, canManage }),
  };
}
test("anonymous requests load only public selections and always-loaded preferences", async () => {
  const { manager, reads } = setup();
  const result = await manager.loadRequest([
    "public.branding",
    "private.operations",
    "user.notifications",
    "public.branding",
  ]);
  assert.deepEqual(reads.map((item) => item.settingsId).sort(), [
    "public.branding",
    "public.preferences",
  ]);
  assert.equal(result.private, undefined);
  assert.equal(result.user, undefined);
  assert.equal(result.public?.["public.branding"]?.tagline, "Welcome");
});
test("authenticated requests load selected groups without eagerly reading all settings", async () => {
  const { manager, reads } = setup({ id: "alice", authenticated: true });
  await manager.loadRequest(["private.operations"]);
  assert.deepEqual(reads.map((item) => item.settingsId).sort(), [
    "private.operations",
    "public.preferences",
    "user.preferences",
  ]);
  assert.equal(reads.find((item) => item.scope === "user")?.userId, "alice");
});
test("cookies override public and personal defaults only in request values", async () => {
  const { manager } = setup({ id: "alice", authenticated: true });
  const values = await manager.loadRequest([], {
    "ci-locale": "ar",
    "ci-theme": "dark",
    "ci-time-format": "12h",
  });
  assert.deepEqual(ciResolveSettingsPreferences(values), {
    locale: "ar",
    theme: "dark",
    timeFormat: "12h",
    timeZone: "UTC",
  });
  assert.equal((await manager.read("public.preferences")).value.theme, "light");
  assert.equal((await manager.read("user.preferences")).value.theme, "");
});
test("absent cookie resolves personal preference before application default", () => {
  assert.equal(
    ciResolveSettingsPreferences({
      public: { "public.preferences": { theme: "dark" } },
      user: { "user.preferences": { theme: "light" } },
    }).theme,
    "light",
  );
});
test("anonymous private/personal reads and all management are denied before storage", async () => {
  const { manager, reads, writes } = setup();
  await assert.rejects(manager.read("private.operations"), /Sign in/);
  await assert.rejects(manager.read("user.notifications"), /Sign in/);
  await assert.rejects(manager.list("public"), /Sign in/);
  await assert.rejects(
    manager.save("public.branding", { tagline: "Changed" }, 0),
    /Sign in/,
  );
  assert.equal(reads.length + writes.length, 0);
});
test("ordinary authenticated users can read private values but cannot manage application settings", async () => {
  const { manager, writes } = setup({ id: "alice", authenticated: true });
  assert.equal((await manager.read("private.operations")).value.active, true);
  await assert.rejects(manager.list("private"), /management access/);
  await assert.rejects(
    manager.save("public.branding", { tagline: "Changed" }, 0),
    /update access/,
  );
  assert.equal(writes.length, 0);
});
test("personal saves bind the owner to the authenticated actor and validate input", async () => {
  const { manager, writes, canManage } = setup({
    id: "alice",
    authenticated: true,
  });
  const saved = await manager.save("user.notifications", { email: false }, 4);
  assert.equal(saved.revision, 5);
  assert.equal(writes[0]?.userId, "alice");
  assert.equal(writes[0]?.expectedRevision, 4);
  assert.equal(canManage.mock.callCount(), 0);
  await assert.rejects(
    manager.save("user.notifications", { email: false, userId: "bob" }, 5),
  );
  await assert.rejects(manager.save("user.notifications", { email: "yes" }, 5));
  assert.equal(writes.length, 1);
});
test("authorized application saves and invalid selections fail explicitly", async () => {
  const { manager } = setup({ id: "admin", authenticated: true }, true);
  assert.equal(
    (await manager.save("public.branding", { tagline: "Changed" }, 0)).value
      .tagline,
    "Changed",
  );
  await assert.rejects(
    manager.loadRequest(["public.missing"]),
    /Unknown settingsId/,
  );
  await assert.rejects(manager.save("public.branding", { tagline: "" }, 0));
  await assert.rejects(
    manager.save("public.branding", { tagline: "ok" }, -1),
    /revision/,
  );
});
test("registry rejects core replacement and prototype IDs", () => {
  assert.throws(
    () =>
      ciCreateCoreSettingsRegistry({
        "public.preferences": { scope: "public" },
      }),
    /cannot replace/,
  );
  assert.throws(
    () =>
      ciDefineSettingsRegistry({ constructor: { scope: "public" as const } }),
    /Invalid/,
  );
  assert.throws(() => registry.get("toString"), /Unknown/);
});

test("whole-form saves validate every section before a single atomic provider call", async () => {
  const { manager, writes, store } = setup(
    { id: "admin", authenticated: true },
    true,
  );
  assert.ok(store.setMany);
  const transaction = mock.fn(store.setMany);
  store.setMany = transaction;
  const general = {
    id: "public.general",
    value: { applicationName: "Updated" },
    revision: 2,
  };
  await assert.rejects(
    manager.saveAll([
      general,
      { id: "public.branding", value: { tagline: "" }, revision: 0 },
    ]),
    /Branding|public.branding/,
  );
  assert.equal(transaction.mock.callCount(), 0);
  assert.equal(writes.length, 0);
  const saved = await manager.saveAll([
    general,
    { id: "public.branding", value: { tagline: "New" }, revision: 0 },
  ]);
  assert.equal(transaction.mock.callCount(), 1);
  assert.deepEqual(
    saved.map((group) => [group.id, group.revision]),
    [
      ["public.general", 3],
      ["public.branding", 1],
    ],
  );
});

test("whole-form saves deny anonymous/non-manager actors, mixed categories, duplicates, and unsupported providers", async () => {
  const update = {
    id: "public.branding",
    value: { tagline: "New" },
    revision: 0,
  };
  await assert.rejects(setup().manager.saveAll([update]), /Sign in/);
  await assert.rejects(
    setup({ id: "user", authenticated: true }).manager.saveAll([update]),
    /update access/,
  );
  const { manager, writes, store } = setup(
    { id: "admin", authenticated: true },
    true,
  );
  await assert.rejects(
    manager.saveAll([
      update,
      { id: "user.notifications", value: { email: false }, revision: 0 },
    ]),
    /one settings category/,
  );
  await assert.rejects(manager.saveAll([update, update]), /Duplicate/);
  await assert.rejects(manager.saveAll([]), /at least one/);
  await assert.rejects(
    manager.saveAll([{ ...update, revision: -1 }]),
    /revision/,
  );
  store.setMany = undefined;
  await assert.rejects(manager.saveAll([update]), /does not support/);
  assert.equal(writes.length, 0);
});

test("My Preferences saves bind all sections to the current owner without requiring an admin role", async () => {
  const { manager, writes, canManage } = setup({
    id: "alice",
    authenticated: true,
  });
  const preferences = await manager.read("user.preferences");
  await manager.saveAll([
    {
      id: preferences.id,
      value: { ...preferences.value, theme: "dark" },
      revision: 0,
    },
    { id: "user.notifications", value: { email: false }, revision: 3 },
  ]);
  assert.deepEqual(
    writes.map((input) => [input.scope, input.userId]),
    [
      ["user", "alice"],
      ["user", "alice"],
    ],
  );
  assert.equal(canManage.mock.callCount(), 0);
});
