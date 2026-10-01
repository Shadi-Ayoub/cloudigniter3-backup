import assert from "node:assert/strict";
import test from "node:test";
import { ciCreateCoreSettingsRegistry } from "@cloudigniter/core/lib";
import { ciCreateNextAwsSettingsManager } from "../../src/server/settings/ci-create-next-aws-settings-manager";
import type { CiSettingsUpdate } from "@cloudigniter/core/types";
import { ciSettingsReturnTarget } from "../../src/ui/client/components/settings/ci-settings-return-target";

test("Close returns to a previous application path and rejects external or self-referential targets", () => {
  const resolve = (target: string) =>
    ciSettingsReturnTarget(target, "https://app.example", "/account/settings");
  assert.equal(
    resolve("/dashboard/users?search=Alice#results"),
    "/dashboard/users?search=Alice#results",
  );
  for (const target of [
    "https://evil.example",
    "//evil.example",
    "/\\\\evil.example",
    "javascript:alert(1)",
    "/account/settings?returnTo=/account/settings",
    "",
  ])
    assert.equal(resolve(target), "/dashboard", target);
});

test("the Next adapter submits a complete form in one authorized backend request", async () => {
  const registry = ciCreateCoreSettingsRegistry();
  const submitted: CiSettingsUpdate[][] = [];
  const manager = ciCreateNextAwsSettingsManager({
    registry,
    actor: { id: "admin", authenticated: true },
    canManage: () => true,
    operations: {
      get: async () => {
        throw new Error("Unexpected read");
      },
      set: async () => {
        throw new Error("Independent writes must not be used");
      },
      setMany: async ({ groups }) => {
        submitted.push([...groups]);
        return {
          data: {
            ok: true,
            statusCode: 200,
            body: {
              groups: groups.map((input) => ({
                ...input,
                scope: registry.get(input.id).scope,
                revision: input.revision + 1,
              })),
            },
          },
        };
      },
    },
  });
  const updates = ["public.general", "public.preferences"].map((id) => ({
    id,
    value: registry.get(id).defaults,
    revision: 0,
  }));
  const result = await manager.saveAll(updates);
  assert.equal(submitted.length, 1);
  assert.deepEqual(submitted[0], updates);
  assert.deepEqual(
    result.map((group) => group.revision),
    [1, 1],
  );
});

test("an undeployed backend cannot report a successful whole-form save", async () => {
  const registry = ciCreateCoreSettingsRegistry();
  let called = false;
  const operation = async () => {
    called = true;
    throw new Error("Unexpected call");
  };
  const manager = ciCreateNextAwsSettingsManager({
    registry,
    actor: { id: "admin", authenticated: true },
    canManage: () => true,
    provisioned: false,
    operations: { get: operation, set: operation, setMany: operation },
  });
  await assert.rejects(
    manager.saveAll([
      {
        id: "public.general",
        value: registry.get("public.general").defaults,
        revision: 0,
      },
    ]),
    /Deploy/,
  );
  assert.equal(called, false);
});

test("backend conflicts and incomplete batch responses fail without attempting independent writes", async () => {
  const registry = ciCreateCoreSettingsRegistry();
  const update = {
    id: "public.general",
    value: registry.get("public.general").defaults,
    revision: 0,
  };
  for (const body of [
    {
      ok: false,
      statusCode: 400,
      body: { error: "Conflict: no sections were saved" },
    },
    { ok: true, statusCode: 200, body: { groups: [] } },
    {
      ok: true,
      statusCode: 200,
      body: {
        groups: [
          { id: update.id, value: update.value, scope: "private", revision: 1 },
        ],
      },
    },
  ]) {
    const manager = ciCreateNextAwsSettingsManager({
      registry,
      actor: { id: "admin", authenticated: true },
      canManage: () => true,
      operations: {
        get: async () => {
          throw new Error("Unexpected read");
        },
        set: async () => {
          throw new Error("Unexpected independent write");
        },
        setMany: async () => ({ data: body }),
      },
    });
    await assert.rejects(
      manager.saveAll([update]),
      /Conflict|incomplete save|invalid save/,
    );
  }
});

test("request reads forward the resolved tenant without enabling management mode for later groups", async () => {
  const registry = ciCreateCoreSettingsRegistry();
  const seen: object[] = [];
  const target = { scope: "tenant", tenantId: "A" } as const;
  const manager = ciCreateNextAwsSettingsManager({
    registry,
    target,
    actor: { id: "user", authenticated: true },
    canManage: () => false,
    operations: {
      get: async (input) => {
        seen.push(input);
        const entry = registry.get(input.id);
        return {
          data: {
            ok: true,
            statusCode: 200,
            body: {
              id: input.id,
              scope: entry.scope,
              value: entry.defaults,
              revision: 1,
              systemRevision: 3,
              lockedFields: ["theme"],
            },
          },
        };
      },
      set: async () => {
        throw new Error("Unexpected write");
      },
    },
  });
  await manager.loadRequest(["private.email"]);
  assert.equal(seen.length, 3);
  assert.ok(
    seen.every((input) => JSON.stringify(input).includes('"tenantId":"A"')),
  );
  assert.ok(seen.every((input) => !("manage" in input)));
});

test("tenant saves preserve target and source revision and retain effective lock metadata", async () => {
  const registry = ciCreateCoreSettingsRegistry();
  const target = { scope: "global" } as const;
  const update = {
    id: "public.general",
    value: { applicationName: "Global" },
    revision: 2,
    systemRevision: 4,
  };
  let received: unknown;
  const manager = ciCreateNextAwsSettingsManager({
    registry,
    target,
    actor: { id: "admin", authenticated: true },
    canManage: () => true,
    operations: {
      get: async () => {
        throw new Error("Unexpected read");
      },
      set: async () => {
        throw new Error("Unexpected single save");
      },
      setMany: async (input) => {
        received = input;
        return {
          data: {
            ok: true,
            statusCode: 200,
            body: {
              groups: [
                {
                  ...update,
                  scope: "public",
                  revision: 3,
                  lockedFields: ["applicationName"],
                },
              ],
            },
          },
        };
      },
    },
  });
  const result = await manager.saveAll([update]);
  assert.deepEqual(received, { groups: [update], target });
  assert.deepEqual(result[0]?.lockedFields, ["applicationName"]);
  assert.equal(result[0]?.systemRevision, 4);
});

test("an older backend response cannot silently resolve a tenant to System settings", async () => {
  const registry = ciCreateCoreSettingsRegistry();
  const manager = ciCreateNextAwsSettingsManager({
    registry,
    target: { scope: "global" },
    actor: { id: null, authenticated: false },
    canManage: () => false,
    operations: {
      get: async ({ id }) => ({
        data: {
          ok: true,
          statusCode: 200,
          body: {
            id,
            scope: "public",
            value: registry.get(id).defaults,
            revision: 0,
          },
        },
      }),
      set: async () => {
        throw new Error("Unexpected write");
      },
    },
  });
  await assert.rejects(manager.read("public.general"), /updated backend/);
});
