import assert from "node:assert/strict";
import test from "node:test";

import { NextRequest } from "next/server";

import type { CiRoutesMap, CiTenantScope } from "@ci-core/types";

import { ciHandleRouteLogic } from "../../src/server/proxy/ci-handle-route-logic";

const legacyRoutes = {
  "/dashboard/books": {
    title: "Books",
    namespace: "dashboard.books",
    protected: false,
  },
} satisfies CiRoutesMap;

const tenantRoutes = {
  "/dashboard/books": {
    title: "Books",
    namespace: "dashboard.books",
    protected: false,
    tenantScopes: ["tenant"],
  },
} satisfies CiRoutesMap;

function createRequest(): NextRequest {
  return new NextRequest("http://localhost/t/acme/dashboard/books");
}

function resolveRoute(routes: CiRoutesMap, tenantScope?: CiTenantScope) {
  return ciHandleRouteLogic({
    request: createRequest(),
    pathnameNormalized: "/dashboard/books",
    routes,
    tenantScope,
  });
}

test("keeps routes without tenantScopes available to existing callers", async () => {
  const result = await resolveRoute(legacyRoutes);

  assert.equal(result.action, "continue");
  assert.equal(result.route?.namespace, "dashboard.books");
});

test("allows a route in its declared Tenant scope", async () => {
  const result = await resolveRoute(tenantRoutes, "tenant");

  assert.equal(result.action, "continue");
  assert.deepEqual(result.route?.tenantScopes, ["tenant"]);
});

test("rejects a route outside its declared Tenant scope", async () => {
  const result = await resolveRoute(tenantRoutes, "global");

  assert.deepEqual(result, {
    action: "route-info",
    route: null,
    details: {
      requestedPath: "/dashboard/books",
      reason: "route-tenant-scope-not-allowed",
      matchedPattern: "/dashboard/books",
    },
  });
});

test("rejects a constrained route when an older caller omits current scope", async () => {
  const result = await resolveRoute(tenantRoutes);

  if (result.action !== "route-info") {
    assert.fail(`Expected route-info, received ${result.action}.`);
  }

  assert.equal(result.details.reason, "route-tenant-scope-not-allowed");
});

test("supports a logical route in more than one declared scope", async () => {
  const routes = {
    "/dashboard/books": {
      title: "Books",
      namespace: "dashboard.books",
      protected: false,
      tenantScopes: ["global", "tenant"],
    },
  } satisfies CiRoutesMap;

  const [globalResult, tenantResult] = await Promise.all([
    resolveRoute(routes, "global"),
    resolveRoute(routes, "tenant"),
  ]);

  assert.equal(globalResult.action, "continue");
  assert.equal(tenantResult.action, "continue");
});

test("treats an explicitly empty tenantScopes list as unavailable", async () => {
  const routes = {
    "/dashboard/books": {
      title: "Books",
      namespace: "dashboard.books",
      protected: false,
      tenantScopes: [],
    },
  } satisfies CiRoutesMap;

  const result = await resolveRoute(routes, "system");

  assert.equal(result.action, "route-info");
});
