import assert from "node:assert/strict";
import test from "node:test";

import {
  ciBuildTenantPublicPathname,
  ciDeserializeRequestContext,
  ciSerializeRequestContext,
} from "@ci-core/lib";
import type { CiRequestContext } from "@ci-core/types";

test("builds slug-based Tenant and Global public feature pathnames", () => {
  assert.equal(
    ciBuildTenantPublicPathname({
      featurePathname: "/dashboard/books/",
      tenant: {
        mode: "slug",
        scope: "tenant",
        slug: "acme",
      },
    }),
    "/t/acme/dashboard/books",
  );

  assert.equal(
    ciBuildTenantPublicPathname({
      featurePathname: "/dashboard/books",
      tenant: {
        mode: "slug",
        scope: "global",
      },
    }),
    "/t/global/dashboard/books",
  );

  assert.equal(
    ciBuildTenantPublicPathname({
      featurePathname: "/dashboard/books",
      tenant: {
        mode: "slug",
        scope: "tenant",
        slug: "acme",
      },
      tenantBasePath: "",
    }),
    "/acme/dashboard/books",
  );
});

test("keeps system and subdomain feature pathnames unprefixed", () => {
  assert.equal(
    ciBuildTenantPublicPathname({
      featurePathname: "dashboard/books?view=compact",
      tenant: {
        mode: "slug",
        scope: "system",
      },
    }),
    "/dashboard/books",
  );

  assert.equal(
    ciBuildTenantPublicPathname({
      featurePathname: "/dashboard/books",
      tenant: {
        mode: "subdomain",
        scope: "tenant",
        slug: "acme",
      },
    }),
    "/dashboard/books",
  );
});

test("requires a route-safe slug for a slug-based Tenant pathname", () => {
  assert.throws(
    () =>
      ciBuildTenantPublicPathname({
        featurePathname: "/dashboard/books",
        tenant: {
          mode: "slug",
          scope: "tenant",
        },
      }),
    /requires a route-safe Tenant slug/,
  );
});

test("round-trips valid route tenant scopes and rejects invalid values", () => {
  const context: CiRequestContext = {
    schemaVersion: 1,
    tenant: {
      scope: "tenant",
      mode: "slug",
      status: "active",
      exists: true,
      pathname: "/t/acme/dashboard/books",
      source: "slug",
      id: "tenant-acme",
      slug: "acme",
    },
    orgUnit: null,
    featurePathname: "/dashboard/books",
    route: {
      title: "Books",
      namespace: "dashboard.books",
      protected: true,
      tenantScopes: ["tenant"],
      pathname: "/dashboard/books",
      publicPathname: "/t/acme/dashboard/books",
      matchedPattern: "/dashboard/books",
      matchKind: "exact",
      wildcardPath: null,
      search: "",
      requestTarget: "/t/acme/dashboard/books",
      searchParams: {},
    },
  };

  assert.deepEqual(
    ciDeserializeRequestContext(ciSerializeRequestContext(context)),
    context,
  );

  const invalidContext = {
    ...context,
    route: {
      ...context.route,
      tenantScopes: ["workspace"],
    },
  };

  assert.throws(
    () =>
      ciDeserializeRequestContext(
        encodeURIComponent(JSON.stringify(invalidContext)),
      ),
    /invalid or unsupported/,
  );
});
