import assert from "node:assert/strict";
import test from "node:test";

import { ciGetRoutes, ciMergeRouteMaps } from "@ci-core/lib";
import type { CiRoutesMap } from "@ci-core/types";

const customRoute = {
  "/dashboard/books": {
    title: "Manage Books",
    namespace: "dashboard",
    protected: true,
    tenantScopes: ["tenant"],
  },
} satisfies CiRoutesMap;

test("merges custom routes without copying the core registry into the app", () => {
  const routes = ciGetRoutes(customRoute);
  assert.equal(routes["/dashboard"]?.title, "Admin Dashboard");
  assert.equal(routes["/dashboard/books"]?.title, "Manage Books");
});

test("registers the resources catalog as a standalone dashboard route", () => {
  const routes = ciGetRoutes({});
  const resources = routes["/dashboard/resources"];

  assert.equal(resources?.title, "Resources Catalog");
  assert.equal(resources?.namespace, "dashboard.resources");
  assert.deepEqual(resources?.access, {
    resource: "platform.dashboard",
    action: "read",
  });
});

test("protects the user administration route and its child pages", () => {
  const routes = ciGetRoutes({});

  for (const pathname of ["/dashboard/users", "/dashboard/users/*"] as const) {
    assert.deepEqual(routes[pathname]?.access, {
      resource: "identity.users",
      action: "read",
    });
  }
});

test("rejects custom routes that replace a core or generated route", () => {
  assert.throws(
    () => ciGetRoutes({ "/dashboard": customRoute["/dashboard/books"]! }),
    /CloudIgniter route collision/,
  );
  assert.throws(
    () => ciMergeRouteMaps(customRoute, customRoute),
    /CloudIgniter route collision/,
  );
});
