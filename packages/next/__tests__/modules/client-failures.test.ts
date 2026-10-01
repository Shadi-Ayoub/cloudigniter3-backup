import assert from "node:assert/strict";
import test from "node:test";
import type { CiExtensionManifest } from "@cloudigniter/core/types";
import type { CiNextExtensionClientOptions } from "../../src/types";
import { ciCreateNextExtensionClient } from "../../src/server/modules/ci-create-next-extension-client";

const manifest: CiExtensionManifest = { schemaVersion: 1, kind: "extension", id: "tasks", name: "Tasks", version: "1.0.0", runtime: { client: true, server: true }, target: { framework: "next", clouds: ["aws"] } };
const context: CiNextExtensionClientOptions["context"] = { env: { mode: "development" }, auth: { mode: "userPool", user: { id: "dev", authenticated: true, roles: ["developer"], primaryRole: "developer" } } };
function client(overrides: Partial<CiNextExtensionClientOptions> = {}) {
  return ciCreateNextExtensionClient({ context, manifests: [manifest], host: { framework: "next", cloud: "aws" }, operations: {}, ...overrides });
}
function response(body: unknown) { return { data: JSON.stringify({ ok: true, statusCode: 200, body }) }; }
const install = { id: "tasks", action: "install", revision: 0 } as const;
for (const mode of ["production", "staging", "test"] as const) {
  test(`module management in ${mode} is denied before provider access`, async () => {
    const c = client({ context: { ...context, env: { mode } }, operations: { manage: async () => assert.fail("Provider must not be called") } });
    assert.equal((await c.list()).ok, false);
    assert.equal((await c.command(install)).ok, false);
  });
}
test("all module operations require a signed-in actor", async () => {
  const c = client({ context: { ...context, auth: { ...context.auth, user: { ...context.auth.user, authenticated: false } } }, operations: { manage: async () => assert.fail("Provider must not be called"), execute: async () => assert.fail("Provider must not be called") } });
  for (const result of [await c.list(), await c.command(install), await c.enabled(), await c.execute("tasks", {})]) assert.equal(result.ok, false);
});
test("authenticated non-developers cannot manage modules", async () => {
  const c = client({ context: { ...context, auth: { ...context.auth, user: { ...context.auth.user, roles: ["administrator"] } } } });
  assert.equal((await c.list()).ok, false);
  assert.equal((await c.command(install)).ok, false);
});
test("missing endpoints report actionable errors while an ordinary dashboard remains available", async () => {
  const c = client();
  assert.equal((await c.list()).ok, false);
  assert.equal((await c.command(install)).ok, false);
  assert.equal((await c.execute("tasks", {})).ok, false);
  assert.deepEqual(await c.enabled(), { ok: true, statusCode: 200, body: [] });
});
for (const body of [null, {}, { revision: 0, entries: null }, { revision: 1.5, entries: [] }]) {
  test(`invalid module catalogue ${JSON.stringify(body)} cannot become a successful response`, async () => {
    assert.equal((await client({ operations: { manage: async () => response(body) } }).list()).ok, false);
  });
}
test("provider exceptions and GraphQL errors remain failures", async () => {
  for (const operation of [async () => { throw new Error("offline"); }, async () => { throw "provider error"; }, async () => ({ data: null, errors: [{ message: "Provider unavailable" }] })]) {
    const c = client({ operations: { manage: operation, execute: operation } });
    assert.equal((await c.list()).ok, false);
    assert.equal((await c.execute("tasks", {})).ok, false);
  }
});
test("successful commands retain concurrency revision and return an authoritative catalogue", async () => {
  const c = client({ operations: { manage: async (command) => {
    assert.deepEqual(command, install);
    return response({ revision: 1, entries: [{ manifest, compatible: true }] });
  } } });
  const result = await c.command(install);
  assert.ok(result.ok);
  assert.equal(result.body.revision, 1);
  assert.equal(result.body.entries[0]?.backendAvailable, true);
});
test("enabled modules must match local code, version and host compatibility", async () => {
  const entries = [
    { manifest },
    { manifest: { ...manifest, version: "2.0.0" } },
    { manifest: { ...manifest, id: "missing" } },
  ];
  const result = await client({ operations: { execute: async () => response(entries) } }).enabled();
  assert.ok(result.ok);
  assert.deepEqual(result.body, [entries[0]]);
  assert.equal((await client({ operations: { execute: async () => response({}) } }).enabled()).ok, false);
});
test("execution requires local module code and forwards the original input", async () => {
  const input = { action: "read", tenantId: "acme" };
  const c = client({ operations: { execute: async (args) => { assert.deepEqual(args, { id: "tasks", input }); return response({ value: 42 }); } } });
  assert.equal((await c.execute("missing", input)).ok, false);
  const result = await c.execute("tasks", input);
  assert.ok(result.ok);
  assert.deepEqual(result.body, { value: 42 });
});
