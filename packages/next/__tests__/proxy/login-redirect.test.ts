import assert from "node:assert/strict";
import test from "node:test";

import { NextRequest } from "next/server";

import { ciCoreRoutes } from "@cloudigniter/core/lib";

import { ciHandleRouteLogic } from "../../src/server/proxy/ci-handle-route-logic";

function resolveRoute(target: string, cookie?: string) {
  const request = new NextRequest(new URL(target, "http://localhost:3000"), {
    headers: cookie ? { cookie } : undefined,
  });

  return ciHandleRouteLogic({
    request,
    pathnameNormalized: request.nextUrl.pathname,
    routes: ciCoreRoutes,
    tenantScope: "system",
  });
}

test("redirects an active session from login to the requested dashboard", async (t) => {
  const cookie = "test-session=active";
  const sessionFetch = t.mock.method(
    globalThis,
    "fetch",
    async (url: Parameters<typeof fetch>[0], options?: RequestInit) => {
      assert.equal(String(url), "http://localhost:3000/ci-internal/auth/session");
      assert.equal(options?.method, "POST");
      assert.equal(options?.redirect, "error");
      assert.equal(new Headers(options?.headers).get("cookie"), cookie);

      return Response.json({ ok: true, authenticated: true });
    },
  );

  const result = await resolveRoute("/login?next=%2Fdashboard", cookie);

  assert.equal(sessionFetch.mock.callCount(), 1);
  assert.equal(result.action, "redirect");
  if (result.action !== "redirect") assert.fail("Expected an authenticated login redirect.");
  assert.equal(result.destination.href, "http://localhost:3000/dashboard");
});

test("preserves the requested internal destination and its query", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ authenticated: true }));
  const destination = "/t/acme/dashboard/books?view=recent";

  const result = await resolveRoute(`/login?next=${encodeURIComponent(destination)}`);

  if (result.action !== "redirect") assert.fail("Expected an authenticated login redirect.");
  assert.equal(result.destination.href, `http://localhost:3000${destination}`);
});

test("defaults authenticated login visits to dashboard when next is absent or external", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ authenticated: true }));

  for (const next of [undefined, "", "https://example.com", "//example.com", "/\\example.com"]) {
    const target = next === undefined ? "/login" : `/login?next=${encodeURIComponent(next)}`;
    const result = await resolveRoute(target);

    if (result.action !== "redirect") assert.fail("Expected an authenticated login redirect.");
    assert.equal(result.destination.href, "http://localhost:3000/dashboard");
  }
});

test("leaves the login page available when the session endpoint denies authentication", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ ok: true, authenticated: false }, { status: 401 }),
  );

  const result = await resolveRoute("/login?next=%2Fdashboard");

  assert.equal(result.action, "continue");
});

test("redirects a signed-out protected request to login with its return destination", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ ok: true, authenticated: false }, { status: 401 }),
  );

  const result = await resolveRoute("/dashboard?view=recent");

  if (result.action !== "redirect") assert.fail("Expected a sign-in redirect.");
  assert.equal(result.destination.pathname, "/login");
  assert.equal(result.destination.searchParams.get("next"), "/dashboard?view=recent");
});

test("allows an active session to open public settings and return there from login", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ authenticated: true }));
  const destination = "/dashboard/settings/public";

  assert.equal((await resolveRoute(destination)).action, "continue");
  const login = await resolveRoute(`/login?next=${encodeURIComponent(destination)}`);
  if (login.action !== "redirect") assert.fail("Expected an authenticated login redirect.");
  assert.equal(login.destination.pathname, destination);
});

test("does not turn a missing or failed session endpoint into a login loop", async (t) => {
  const diagnostic = t.mock.method(console, "error", () => {});
  for (const status of [404, 500, 503]) {
    const sessionFetch = t.mock.method(globalThis, "fetch", async () =>
      new Response("Session endpoint unavailable", { status }),
    );

    assert.equal((await resolveRoute("/dashboard/settings/public")).action, "auth-unavailable");
    assert.equal((await resolveRoute("/login?next=%2Fdashboard%2Fsettings%2Fpublic")).action, "auth-unavailable");
    sessionFetch.mock.restore();
  }
  assert.equal(diagnostic.mock.callCount(), 6);
});

test("does not treat a network failure as a signed-out session", async (t) => {
  t.mock.method(console, "error", () => {});
  t.mock.method(globalThis, "fetch", async () => { throw new TypeError("fetch failed"); });

  assert.equal((await resolveRoute("/dashboard")).action, "auth-unavailable");
});

test("requires an explicit authentication result from successful session responses", async (t) => {
  t.mock.method(console, "error", () => {});
  for (const body of ["<html>Not found</html>", "null", "{}", '{"authenticated":"true"}']) {
    const sessionFetch = t.mock.method(globalThis, "fetch", async () => new Response(body));
    assert.equal((await resolveRoute("/dashboard")).action, "auth-unavailable");
    sessionFetch.mock.restore();
  }
});

test("denies access when a successful session response explicitly reports signed out", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ authenticated: false }));
  const result = await resolveRoute("/dashboard/settings/public");
  if (result.action !== "redirect") assert.fail("Expected a sign-in redirect.");
  assert.equal(result.destination.pathname, "/login");
});

test("keeps public pages available without consulting the session endpoint", async (t) => {
  const sessionFetch = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Public routes must not request a session.");
  });
  assert.equal((await resolveRoute("/")).action, "continue");
  assert.equal(sessionFetch.mock.callCount(), 0);
});
