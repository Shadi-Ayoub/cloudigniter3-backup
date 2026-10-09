import test from "node:test";
import assert from "node:assert/strict";
import { authorizeDocsSession } from "../hosting/authorize-session.mjs";

const now = 1_800_000_000;
function runtime(overrides = {}) {
  const issued = [];
  const checks = [];
  return {
    issued,
    checks,
    resolveUser: async () => ({
      id: "company-user",
      authenticated: true,
      roles: ["developer"],
      sessionExpiresAt: new Date((now + 600) * 1000).toISOString(),
      ...overrides,
    }),
    authorize: async (request) => {
      checks.push(request);
      return { allowed: true, evaluatedRoleIds: ["developer"] };
    },
    issueAccess: async (grant) => {
      issued.push(grant);
    },
  };
}
test("anonymous users and authenticated non-developers never receive Docs access", async () => {
  for (const user of [
    { authenticated: false },
    { id: null },
    { roles: ["user"] },
    { roles: ["admin", "system-super-admin"] },
    { roles: ["Developer", "developer-tools"] },
  ]) {
    const adapter = runtime(user);
    assert.equal((await authorizeDocsSession(adapter, now)).allowed, false);
    assert.deepEqual(adapter.issued, []);
    assert.deepEqual(adapter.checks, []);
  }
});
test("the developer role also needs an allowed EmberGuard decision with active developer evaluation", async () => {
  for (const decision of [
    { allowed: false, evaluatedRoleIds: ["developer"] },
    { allowed: true, evaluatedRoleIds: ["admin"] },
  ]) {
    const adapter = runtime();
    adapter.authorize = async () => decision;
    assert.equal((await authorizeDocsSession(adapter, now)).status, 403);
    assert.deepEqual(adapter.issued, []);
  }
});
test("authorized company developers receive a grant limited to the protected Docs prefix and session lifetime", async () => {
  for (const lifetime of [60, 600]) {
    const adapter = runtime({
      sessionExpiresAt: new Date((now + lifetime) * 1000).toISOString(),
    });
    const result = await authorizeDocsSession(adapter, now);
    assert.equal(result.allowed, true);
    assert.deepEqual(adapter.checks, [
      { resource: "documentation.company", action: "read" },
    ]);
    assert.deepEqual(adapter.issued, [
      {
        resource: "https://docs.cloudigniter.io/developers/*",
        cookiePath: "/developers/",
        expiresAt: now + Math.min(lifetime, 300),
      },
    ]);
  }
});
test("expired, missing or invalid template session lifetimes fail without issuing access", async () => {
  for (const sessionExpiresAt of [
    "",
    "invalid",
    new Date(now * 1000).toISOString(),
  ]) {
    const adapter = runtime({ sessionExpiresAt });
    assert.equal((await authorizeDocsSession(adapter, now)).status, 401);
    assert.deepEqual(adapter.issued, []);
  }
});
test("template authentication and EmberGuard failures propagate without an access grant", async () => {
  for (const phase of ["resolveUser", "authorize"]) {
    const adapter = runtime();
    adapter[phase] = async () => {
      throw new Error("Identity/policy unavailable");
    };
    await assert.rejects(authorizeDocsSession(adapter, now), /unavailable/);
    assert.deepEqual(adapter.issued, []);
  }
});
