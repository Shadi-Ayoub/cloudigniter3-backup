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
