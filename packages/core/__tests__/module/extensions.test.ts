import assert from "node:assert/strict";
import test from "node:test";
import {
  ciCreateExtensionManager,
  ciResolveExtensionConfiguration,
  ciValidateExtensionManifest,
  ciExtensionAccessControl,
  ciCreateAppAccessControl,
  ciCreateAuthorizer,
} from "../../src/lib";
import type {
  CiExtensionManifest,
  CiExtensionSnapshot,
  CiExtensionManagerOptions,
  CiExtensionInfrastructureState,
} from "../../src/types";

const manifest: CiExtensionManifest = {
  schemaVersion: 1,
  kind: "extension",
  id: "tasks",
  name: "Tasks",
  version: "1.0.0",
  runtime: { client: true, server: true },
  target: { framework: "next", clouds: ["aws"] },
  settings: [
    {
      key: "priority",
      title: "Priority",
      default: "normal",
      options: ["normal", "high"],
    },
  ],
};
function fixture(manifests: readonly CiExtensionManifest[] = [manifest]) {
  let state: CiExtensionSnapshot = { revision: 0, installations: {} };
  let infrastructure: CiExtensionInfrastructureState = { status: "pending" };
  let operations = 0;
  const calls: string[] = [];
  const options: CiExtensionManagerOptions = {
    manifests,
    host: { framework: "next", cloud: "aws" },
    store: {
      read: async () => structuredClone(state),
      write: async (next, revision) => {
        if (state.revision !== revision) throw new Error("concurrent write");
        state = structuredClone(next);
      },
    },
    provider: {
      plan: (m) => ({ provider: "test", id: `stack-${m.id}` }),
      install: async (record) => {
        calls.push(`install:${record.operationId}`);
      },
      uninstall: async (record) => {
        calls.push(`uninstall:${record.operationId}`);
      },
      inspect: async () => infrastructure,
    },
    authorize: async () => "developer",
    createOperationId: () => `op-${++operations}`,
    now: () => "2026-09-18T00:00:00.000Z",
  };
  const manager = ciCreateExtensionManager(options);
  const run = (
    action: "install" | "enable" | "disable" | "uninstall" | "configure",
    id = "tasks",
    extra = {},
  ) => manager.execute({ id, action, revision: state.revision, ...extra });
  return {
    manager,
    options,
    run,
    calls,
    state: () => state,
    infrastructure: (value: CiExtensionInfrastructureState) => {
      infrastructure = value;
    },
  };
}

test("detected modules are not installed; successful installs remain disabled until enabled", async () => {
  const f = fixture();
  assert.equal((await f.manager.list()).entries[0]!.installation, undefined);
  await f.run("install");
  assert.equal(f.state().installations.tasks!.status, "installing");
  f.infrastructure({
    status: "ready",
    infrastructure: {
      provider: "test",
      id: "stack-arn",
      outputs: { TableName: "tasks" },
    },
  });
  const ready = await f.manager.list();
  assert.equal(ready.entries[0]!.installation!.status, "disabled");
  await f.run("enable");
  await f.run("disable");
  assert.deepEqual(f.calls, ["install:op-1"]);
  assert.equal(f.state().installations.tasks!.infrastructure.id, "stack-arn");
});
test("uninstall requires disabled state and exact confirmation, retaining the record until provider deletion completes", async () => {
  const f = fixture();
  await f.run("install");
  f.infrastructure({ status: "ready" });
  await f.manager.list();
  await f.run("enable");
  await assert.rejects(
    () => f.run("uninstall", "tasks", { confirmation: "tasks" }),
    /Disable/,
  );
  await f.run("disable");
  await assert.rejects(
    () => f.run("uninstall", "tasks", { confirmation: "Tasks" }),
    /exact module ID/,
  );
  await f.run("uninstall", "tasks", { confirmation: "tasks" });
  assert.equal(f.state().installations.tasks!.status, "uninstalling");
  f.infrastructure({ status: "pending" });
  await f.manager.list();
  assert.ok(f.state().installations.tasks);
  f.infrastructure({ status: "missing" });
  await f.manager.list();
  assert.equal(f.state().installations.tasks, undefined);
  assert.equal((await f.manager.list()).entries[0]!.detected, true);
});
test("an uncertain provider failure preserves the operation token for idempotent retry", async () => {
  const f = fixture();
  f.options.provider.install = async (record) => {
    f.calls.push(record.operationId);
    if (f.calls.length === 1) throw new Error("timeout");
  };
  await assert.rejects(() => f.run("install"), /timeout/);
  assert.equal(f.state().installations.tasks!.status, "installing");
  await f.run("install");
  assert.deepEqual(f.calls, ["op-1", "op-1"]);
});
test("concurrent lifecycle requests have one winner and one provider effect", async () => {
  const f = fixture();
  const outcomes = await Promise.allSettled([
    f.run("install"),
    f.run("install"),
  ]);
  assert.equal(
    outcomes.filter((outcome) => outcome.status === "fulfilled").length,
    1,
  );
  assert.equal(f.calls.length, 1);
});
test("core IDs, duplicate IDs, incompatible targets and stale revisions fail before provisioning", async () => {
  for (const id of [
    "security",
    "users",
    "modules",
    "constructor",
    "../escape",
    "cloudigniter.auth",
  ])
    assert.throws(() => ciValidateExtensionManifest({ ...manifest, id }));
  assert.throws(() => fixture([manifest, manifest]), /Duplicate/);
  const f = fixture([{ ...manifest, target: { framework: "other" } }]);
  await assert.rejects(() => f.run("install"), /incompatible/);
  await assert.rejects(
    () => f.manager.execute({ id: "tasks", action: "install", revision: 1 }),
    /changed/,
  );
  await assert.rejects(
    () => f.run("uninstall", "security", { confirmation: "security" }),
    /Core/,
  );
  assert.equal(f.calls.length, 0);
});
test("dependency state cannot be invalidated by disabling or uninstalling a required module", async () => {
  const dependent: CiExtensionManifest = {
    ...manifest,
    id: "calendar",
    dependencies: [{ id: "tasks" }],
  };
  const f = fixture([manifest, dependent]);
  await assert.rejects(() => f.run("install", "calendar"), /required module/);
  await f.run("install");
  f.infrastructure({ status: "ready" });
  await f.manager.list();
  await f.run("enable");
  await f.run("install", "calendar");
  await f.manager.list();
  await f.run("enable", "calendar");
  await assert.rejects(() => f.run("disable"), /dependent/);
  await f.run("disable", "calendar");
  await f.run("disable");
  await assert.rejects(
    () => f.run("uninstall", "tasks", { confirmation: "tasks" }),
    /dependent/,
  );
});
test("missing source and version drift cannot enable retained installations", async () => {
  const f = fixture();
  await f.run("install");
  f.infrastructure({ status: "ready" });
  await f.manager.list();
  for (const manifests of [[], [{ ...manifest, version: "2.0.0" }]]) {
    const manager = ciCreateExtensionManager({ ...f.options, manifests });
    await assert.rejects(
      () =>
        manager.execute({
          id: "tasks",
          action: "enable",
          revision: f.state().revision,
        }),
      /missing, incompatible, or has a different version/,
    );
  }
  const missing = ciCreateExtensionManager({ ...f.options, manifests: [] });
  assert.equal((await missing.list()).entries[0]!.detected, false);
  await missing.execute({
    id: "tasks",
    action: "uninstall",
    revision: f.state().revision,
    confirmation: "tasks",
  });
});
test("module configuration validates declared defaults and rejects unknown values", () => {
  assert.deepEqual(ciResolveExtensionConfiguration(manifest), {
    priority: "normal",
  });
  assert.throws(
    () => ciResolveExtensionConfiguration(manifest, { priority: "urgent" }),
    /Invalid value/,
  );
  assert.throws(
    () => ciResolveExtensionConfiguration(manifest, { arbitrary: true }),
    /Unknown/,
  );
});
test("denied management does not read or write the registry", async () => {
  const f = fixture();
  f.options.authorize = async () => {
    throw new Error("denied");
  };
  f.options.store.read = async () => {
    throw new Error("should not read");
  };
  await assert.rejects(() => f.manager.list(), /denied/);
  await assert.rejects(() => f.run("install"), /denied/);
});
test("provider failure is visible and can be cleaned up without pretending install succeeded", async () => {
  const f = fixture();
  await f.run("install");
  f.infrastructure({ status: "failed", error: "rollback complete" });
  assert.equal(
    (await f.manager.list()).entries[0]!.installation!.status,
    "failed",
  );
  await assert.rejects(() => f.run("enable"), /successfully installed/);
  await f.run("uninstall", "tasks", { confirmation: "tasks" });
});
test("module permission declarations create valid application-owned actions", () => {
  const extension = {
    ...manifest,
    authenticatedAccess: true,
    permissions: [
      { id: "read-own", title: "Read tasks", accessMode: "read" as const },
    ],
  };
  const authorizer = ciCreateAuthorizer(
    ciCreateAppAccessControl(ciExtensionAccessControl([extension])),
  );
  assert.equal(
    authorizer.can({
      subject: {
        id: "user",
        authenticated: true,
        roleAssignments: [
          {
            roleId: "module-tasks-user",
            scope: { kind: "system" },
            propagation: "exact",
          },
        ],
      },
      scope: { kind: "system" },
      resource: "module-tasks.features",
      action: "read-own",
    }),
    true,
  );
});
