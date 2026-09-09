import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runInThisContext } from "node:vm";
import { afterEach, before, test } from "node:test";
import { build } from "esbuild";
import { NextRequest } from "next/server";
import type {
  CiDevTenantResolutionCheckup,
  CiGetOrgUnitByPathInterface,
  CiRequest,
} from "@cloudigniter/core/types";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
const probeTenant = "ci-probe-tenant-6f7a2d91-active";
const probeRoot = "/ci-probe-org-6f7a2d91-root";
const originalEnvMode = process.env.CI_ENV_MODE;
const providerCalls: CiGetOrgUnitByPathInterface[] = [];
let sessionCookie: string | null = null;
let roles = ["developer"];
let beaconEnabled = true;
let providerOrgUnit: Record<string, unknown> | undefined;

let routes: {
  checkup: (request: Request) => Promise<Response>;
  orgUnit: (request: NextRequest) => Promise<Response>;
  tenant: (request: NextRequest) => Promise<Response>;
};

// Bundle the actual template endpoints and Next resolvers. Only application
// configuration, the authenticated provider session, and AppSync are replaced.
before(async () => {
  const result = await build({
    stdin: {
      contents: `
        export { GET as checkup } from "./src/app/(system)/ci-internal/dev-beacon/tenant-resolution-checkup/route";
        export { GET as orgUnit } from "./src/app/(system)/ci-internal/org-unit-lookup/route";
        export { GET as tenant } from "./src/app/(system)/ci-internal/tenant-lookup/route";
      `,
      resolveDir: appRoot,
      loader: "ts",
    },
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    packages: "external",
    plugins: [{
      name: "application-boundaries",
      setup(builder) {
        builder.onResolve({ filter: /app-get-current-user$|app-get-core-config$|app-prepare-server-api-request$|app-server-client$/ },
          (args) => ({ path: path.basename(args.path), external: true }));
        builder.onResolve({ filter: /^@\/kernel\/server(?:\/api)?$|^@cloudigniter\/next\/server$/ },
          (args) => ({ path: args.path, namespace: "composition" }));
        builder.onLoad({ filter: /.*/, namespace: "composition" }, (args) => ({
          contents: args.path === "@cloudigniter/next/server"
            ? `
              export { ciResolveOrgUnitContext } from "../../packages/next/src/server/org-unit/ci-resolve-org-unit-context";
              export { ciResolveTenantContext } from "../../packages/next/src/server/tenant/ci-resolve-tenant-context";
            `
            : `
              export { appGetCoreConfig } from "app-get-core-config";
              export { appGetDevBeaconAccess } from "./src/kernel/server/auth/app-get-dev-beacon-access";
              export { appGetTenantLookupBySlug } from "./src/kernel/server/api/system/tenant/app-get-tenant-lookup-by-slug";
            `,
          resolveDir: appRoot,
          loader: "ts",
        }));
      },
    }],
  });
  const module = { exports: {} };
  const mocks: Record<string, unknown> = {
    "@cloudigniter/core/lib": await import("@cloudigniter/core/lib"),
    "app-get-core-config": {
      appGetCoreConfig: () => ({
        tenant: { enabled: true, mode: "slug", orgUnit: { enabled: true } },
        dev: { debug: { devBeacon: { enabled: beaconEnabled } } },
      }),
    },
    "app-get-current-user": {
      appGetCurrentUser: async () => ({
        isAuthenticated: sessionCookie === "session=developer",
        groups: roles,
      }),
    },
    "app-prepare-server-api-request": {
      appPrepareServerApiRequest: (request: CiRequest) => request,
    },
    "app-server-client": {
      appServerClient: { queries: {
        GetOrgUnitByPath: async ({ inputString }: { inputString: string }) => {
          const request = JSON.parse(inputString) as CiRequest<CiGetOrgUnitByPathInterface>;
          providerCalls.push(request.input);
          return { data: JSON.stringify({
            ok: true,
            statusCode: 200,
            body: { exists: Boolean(providerOrgUnit), orgUnit: providerOrgUnit },
          }) };
        },
      } },
    },
  };
  const load = runInThisContext(`(function(require, module, exports) { ${result.outputFiles[0]!.text}\n})`);
  load((id: string) => mocks[id] ?? require(id), module, module.exports);
  routes = module.exports as typeof routes;
});

afterEach(() => {
  if (originalEnvMode === undefined) delete process.env.CI_ENV_MODE;
  else process.env.CI_ENV_MODE = originalEnvMode;
  sessionCookie = null;
  roles = ["developer"];
  beaconEnabled = true;
  providerOrgUnit = undefined;
  providerCalls.length = 0;
});

test("Dev Beacon resolves all five Org Unit probes through the real lookup endpoint", async (t) => {
  process.env.CI_ENV_MODE = "development";
  sessionCookie = "session=developer";
  const orgUnitRequests: NextRequest[] = [];
  t.mock.method(console, "table", () => {});
  t.mock.method(globalThis, "fetch", async (input: URL | RequestInfo, init?: RequestInit) => {
    const request = new NextRequest(new Request(input, init));
    sessionCookie = request.headers.get("cookie");
    if (request.nextUrl.pathname === "/ci-internal/org-unit-lookup") {
      orgUnitRequests.push(request);
      assert.equal(init?.redirect, "error");
      assert.equal(init?.cache, "no-store");
      const response = await routes.orgUnit(request);
      assert.equal(response.headers.get("cache-control"), "no-store");
      return response;
    }
    assert.equal(request.nextUrl.pathname, "/ci-internal/tenant-lookup");
    return routes.tenant(request);
  });

  const response = await routes.checkup(new Request(
    "http://localhost/ci-internal/dev-beacon/tenant-resolution-checkup",
    { headers: { cookie: "session=developer", "x-ci-request-context": "stale" } },
  ));
  assert.equal(response.status, 200);
  const report = await response.json() as CiDevTenantResolutionCheckup;
  const checks = report.checks.filter((check) => check.area === "orgUnit");
  assert.equal(checks.length, 5);
  for (const check of checks) {
    assert.equal(check.state, "passed", `${check.label}: ${JSON.stringify(check.actual)}`);
    assert.deepEqual(check.actual, check.expected);
  }
  assert.ok(orgUnitRequests.length > 5, "exercise longest-prefix lookup including missing candidates");
  for (const request of orgUnitRequests) {
    assert.equal(request.headers.get("cookie"), "session=developer");
    assert.equal(request.headers.get("x-ci-request-context"), null);
  }
  assert.equal(providerCalls.length, 0, "reserved diagnostic fixtures require no database seeding");
});

test("deep probe lookup includes the fixture's authoritative ancestor IDs", async () => {
  process.env.CI_ENV_MODE = "development";
  sessionCookie = "session=developer";
  const response = await lookup(probeTenant, `${probeRoot}/branch-31f7/leaf-6ac0`);
  assert.deepEqual((await response.json()).ancestorOrgUnitIds, [
    "ci_probe_org_6f7a2d91_root",
    "ci_probe_org_6f7a2d91_branch_31f7",
  ]);
});

for (const scenario of ["anonymous", "non-developer", "production", "test", "staging", "disabled"] as const) {
  test(`does not expose probe fixtures to ${scenario} requests`, async () => {
    process.env.CI_ENV_MODE = ["production", "test", "staging"].includes(scenario) ? scenario : "development";
    sessionCookie = scenario === "anonymous" ? null : "session=developer";
    roles = scenario === "non-developer" ? ["system-admin"] : ["developer"];
    beaconEnabled = scenario !== "disabled";
    const response = await lookup(probeTenant, probeRoot);
    assert.equal((await response.json()).exists, false);
    assert.deepEqual(providerCalls, [{ tenantId: probeTenant, orgUnitPath: probeRoot }]);
  });
}

test("ordinary tenants use the persisted Org Unit even when a mock has the same path", async () => {
  process.env.CI_ENV_MODE = "development";
  sessionCookie = "session=developer";
  providerOrgUnit = {
    id: "persisted-hr", tenantId: "acme", slug: "hr", path: "/hr", status: "archived",
  };
  const response = await lookup("acme", "/hr");
  assert.deepEqual(await response.json(), { exists: true, ...providerOrgUnit });
  assert.deepEqual(providerCalls, [{ tenantId: "acme", orgUnitPath: "/hr" }]);
});

test("a probe path in another tenant is not resolved from fixtures", async () => {
  process.env.CI_ENV_MODE = "development";
  sessionCookie = "session=developer";
  const response = await lookup("another-tenant", probeRoot);
  assert.equal((await response.json()).exists, false);
  assert.equal(providerCalls.length, 1);
});

function lookup(tenant: string, orgUnitPath: string) {
  const url = new URL("http://localhost/ci-internal/org-unit-lookup");
  url.searchParams.set("tenant", tenant);
  url.searchParams.set("path", orgUnitPath);
  return routes.orgUnit(new NextRequest(url));
}
