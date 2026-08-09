import assert from "node:assert/strict";
import test from "node:test";

import { NextRequest } from "next/server";

import {
  CI_DEFAULT_REQUEST_CONTEXT_COOKIE_NAME,
  CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME,
  ciSerializeRequestContext,
} from "@ci-core/lib";
import type { CiRequestContext, CiRoutePattern } from "@ci-core/types";
import { ciResolveRequestContextFromRequest } from "../../src/server/context/ci-resolve-request-context-from-request";

function createContext(pathname: CiRoutePattern, namespace: string): CiRequestContext {
  return {
    schemaVersion: 1,
    tenant: {
      scope: "system",
      mode: "slug",
      status: "active",
      exists: true,
      pathname,
      source: "none",
    },
    orgUnit: null,
    featurePathname: pathname,
    route: {
      title: namespace,
      namespace,
      protected: false,
      pathname,
      publicPathname: pathname,
      matchedPattern: pathname,
      matchKind: "exact",
      wildcardPath: null,
      search: "",
      requestTarget: pathname,
      searchParams: {},
    },
  };
}

function createUnresolvedContext(): CiRequestContext {
  return {
    ...createContext("/dashboard", "dashboard"),
    route: null,
  };
}

function createRequest({
  headerContext,
  cookieContext,
}: {
  headerContext?: CiRequestContext | string;
  cookieContext?: CiRequestContext;
}): NextRequest {
  const headers = new Headers();

  if (headerContext) {
    headers.set(
      CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME,
      typeof headerContext === "string"
        ? headerContext
        : ciSerializeRequestContext(headerContext),
    );
  }

  if (cookieContext) {
    headers.set(
      "cookie",
      `${CI_DEFAULT_REQUEST_CONTEXT_COOKIE_NAME}=${ciSerializeRequestContext(cookieContext)}`,
    );
  }

  return new NextRequest("http://localhost/ci-internal/language", { headers });
}

test("selects a matching cookie when the header context has no resolved route", () => {
  const cookieContext = createContext("/dashboard/theme", "dashboard.theme");
  const request = createRequest({
    headerContext: createUnresolvedContext(),
    cookieContext,
  });

  assert.deepEqual(
    ciResolveRequestContextFromRequest({
      request,
      pathname: "/dashboard/theme",
    }),
    cookieContext,
  );
});

test("selects the candidate matching the authoritative pathname", () => {
  const cookieContext = createContext("/dashboard/theme", "dashboard.theme");
  const request = createRequest({
    headerContext: createContext("/dashboard", "dashboard"),
    cookieContext,
  });

  assert.equal(
    ciResolveRequestContextFromRequest({
      request,
      pathname: "/dashboard/theme/",
    })?.route?.namespace,
    "dashboard.theme",
  );
});

test("honors an explicit cookie preference when both transports match", () => {
  const request = createRequest({
    headerContext: createContext("/dashboard/theme", "stale.dashboard.theme"),
    cookieContext: createContext("/dashboard/theme", "dashboard.theme"),
  });

  assert.equal(
    ciResolveRequestContextFromRequest({
      request,
      pathname: "/dashboard/theme",
      preferredSource: "cookie",
    })?.route?.namespace,
    "dashboard.theme",
  );
});

test("ignores a malformed header when the cookie matches", () => {
  const cookieContext = createContext("/dashboard/theme", "dashboard.theme");
  const request = createRequest({
    headerContext: "%not-valid-context",
    cookieContext,
  });

  assert.equal(
    ciResolveRequestContextFromRequest({
      request,
      pathname: "/dashboard/theme",
    })?.route?.namespace,
    "dashboard.theme",
  );
});

test("does not return a resolved context belonging to another pathname", () => {
  const request = createRequest({
    headerContext: createContext("/dashboard", "dashboard"),
  });

  assert.equal(
    ciResolveRequestContextFromRequest({
      request,
      pathname: "/dashboard/theme",
    }),
    null,
  );
});
