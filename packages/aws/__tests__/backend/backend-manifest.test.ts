import assert from "node:assert/strict";
import test from "node:test";

import {
  CI_CORE_BACKEND_MANIFEST,
  CI_ENV,
  ciCompileBackendManifest,
  ciDefineBackendManifest,
  resourceEnvKeyAllowlist,
} from "@ci-aws/server/backend";

const REQUIRED_ACTIVE_MODULE_IDS = ["userProfileTable", "auth"] as const;

const REQUIRED_ACTIVE_HANDLER_IDS = [
  "ciCreateCognitoUserHandler",
  "ciGetCognitoUserHandler",
  "ciSetCognitoUserPasswordHandler",
] as const;

type ManifestDefinitionInput = Parameters<typeof ciDefineBackendManifest>[0];

/** Compiles a deliberately modified module list for runtime validation tests. */
function compileModules(modules: readonly unknown[]) {
  const definition = ciDefineBackendManifest({
    modules: modules as ManifestDefinitionInput["modules"],
  });

  return ciCompileBackendManifest(definition);
}

/** Returns all values that occur more than once while preserving first duplicate order. */
function findDuplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }

  return [...duplicates];
}

test("publishes a normalized active core backend contract", () => {
  assert.deepEqual(
    CI_CORE_BACKEND_MANIFEST.resourceIds,
    CI_CORE_BACKEND_MANIFEST.moduleIds,
  );
  assert.deepEqual(
    CI_CORE_BACKEND_MANIFEST.moduleIds,
    CI_CORE_BACKEND_MANIFEST.modules.map((module) => module.id),
  );
  assert.equal(
    CI_CORE_BACKEND_MANIFEST.modules.every(
      (module) => module.status === "active",
    ),
    true,
  );

  for (const moduleId of REQUIRED_ACTIVE_MODULE_IDS) {
    assert.equal(CI_CORE_BACKEND_MANIFEST.moduleIds.includes(moduleId), true);
  }

  for (const handlerId of REQUIRED_ACTIVE_HANDLER_IDS) {
    assert.equal(CI_CORE_BACKEND_MANIFEST.handlerIds.includes(handlerId), true);
  }

  assert.deepEqual(findDuplicates(CI_CORE_BACKEND_MANIFEST.moduleIds), []);
  assert.deepEqual(findDuplicates(CI_CORE_BACKEND_MANIFEST.resourceIds), []);
  assert.deepEqual(findDuplicates(CI_CORE_BACKEND_MANIFEST.handlerIds), []);

  assert.deepEqual(
    Object.keys(CI_CORE_BACKEND_MANIFEST.envKeyAllowlist).sort(),
    [...CI_CORE_BACKEND_MANIFEST.handlerIds].sort(),
  );
});

test("keeps global runtime keys in every active handler allowlist", () => {
  for (const handlerId of CI_CORE_BACKEND_MANIFEST.handlerIds) {
    const allowlist = resourceEnvKeyAllowlist[handlerId];

    assert.ok(allowlist, `${handlerId} must have an effective allowlist`);
    assert.equal(allowlist.includes(CI_ENV.CI_REGION), true);
    assert.equal(allowlist.includes(CI_ENV.CI_ENV_MODE), true);
  }
});

test("rejects duplicate module identifiers", () => {
  const [firstModule] = CI_CORE_BACKEND_MANIFEST.modules;
  assert.ok(firstModule);

  assert.throws(
    () => compileModules([firstModule, { ...firstModule }]),
    /duplicate.*module/i,
  );
});

test("rejects duplicate handler identifiers across modules", () => {
  const [profileModule, authModule] = CI_CORE_BACKEND_MANIFEST.modules.filter(
    (module) => module.handlers.length > 0,
  );
  const duplicateHandler = authModule?.handlers[0];

  assert.ok(profileModule);
  assert.ok(authModule);
  assert.ok(duplicateHandler);

  assert.throws(
    () =>
      compileModules([
        {
          ...profileModule,
          handlers: [duplicateHandler],
          envKeyAllowlist: { [duplicateHandler]: [] },
        },
        authModule,
      ]),
    /duplicate.*handler/i,
  );
});

test("rejects a handler repeated within one module", () => {
  const authModule = CI_CORE_BACKEND_MANIFEST.modules.find(
    (module) => module.id === "auth",
  );
  const duplicateHandler = authModule?.handlers[0];

  assert.ok(authModule);
  assert.ok(duplicateHandler);

  assert.throws(
    () =>
      compileModules([
        {
          ...authModule,
          handlers: [...authModule.handlers, duplicateHandler],
        },
      ]),
    /duplicate.*handler/i,
  );
});

test("requires an explicit environment allowlist for every active handler", () => {
  const authModule = CI_CORE_BACKEND_MANIFEST.modules.find(
    (module) => module.id === "auth",
  );
  const handlerWithoutAllowlist = authModule?.handlers[0];

  assert.ok(authModule);
  assert.ok(handlerWithoutAllowlist);

  const envKeyAllowlist = { ...authModule.envKeyAllowlist };
  delete envKeyAllowlist[handlerWithoutAllowlist];

  assert.throws(
    () => compileModules([{ ...authModule, envKeyAllowlist }]),
    /missing.*environment allowlist/i,
  );
});

test("treats an omitted module status as active for compatibility", () => {
  const profileModule = CI_CORE_BACKEND_MANIFEST.modules.find(
    (module) => module.id === "userProfileTable",
  );
  assert.ok(profileModule);

  const moduleWithoutStatus = { ...profileModule };
  delete moduleWithoutStatus.status;

  const manifest = compileModules([moduleWithoutStatus]);
  assert.deepEqual(manifest.moduleIds, ["userProfileTable"]);
});
