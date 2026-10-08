// export const dynamic = "force-dynamic";

// export async function GET(): Promise<Response> {
//   let stage = "starting";

//   try {
//     stage = "importing @cloudigniter/core/lib";
//     const coreLib = await import("@cloudigniter/core/lib");

//     stage = "importing @cloudigniter/next/server";
//     const nextServer = await import("@cloudigniter/next/server");

//     stage = "importing @/kernel/server";
//     const kernelServer = await import("@/kernel/server");

//     stage = "validating probe constants";

//     const probes = coreLib.CI_DEV_TENANT_RESOLUTION_PROBES;

//     if (!probes) {
//       throw new Error("CI_DEV_TENANT_RESOLUTION_PROBES is not exported.");
//     }

//     if (!probes.tenant) {
//       throw new Error("CI_DEV_TENANT_RESOLUTION_PROBES.tenant is missing.");
//     }

//     if (!probes.orgUnit) {
//       throw new Error("CI_DEV_TENANT_RESOLUTION_PROBES.orgUnit is missing.");
//     }

//     stage = "validating resolver exports";

//     if (typeof nextServer.ciResolveTenantContext !== "function") {
//       throw new Error("ciResolveTenantContext is not exported as a function.");
//     }

//     if (typeof nextServer.ciResolveOrgUnitContext !== "function") {
//       throw new Error("ciResolveOrgUnitContext is not exported as a function.");
//     }

//     stage = "validating kernel exports";

//     if (typeof kernelServer.appGetAllServerConfig !== "function") {
//       throw new Error("appGetAllServerConfig is not exported as a function.");
//     }

//     if (typeof kernelServer.appGetDevBeaconAccess !== "function") {
//       throw new Error("appGetDevBeaconAccess is not exported as a function.");
//     }

//     stage = "calling appGetAllServerConfig";
//     const config = await kernelServer.appGetAllServerConfig();

//     stage = "calling appGetDevBeaconAccess";
//     const access = await kernelServer.appGetDevBeaconAccess();

//     stage = "completed";

//     return Response.json({
//       ok: true,
//       marker: "core-lib-import-succeeded",
//       stage: "completed",
//       coreLibLoaded: Boolean(coreLib),
//     });
//   } catch (error: unknown) {
//     return Response.json(
//       {
//         ok: false,
//         stage,
//         message: error instanceof Error ? error.message : "Unknown import error",
//         stack: error instanceof Error ? error.stack : undefined,
//       },
//       {
//         status: 500,
//         headers: {
//           "Cache-Control": "no-store",
//         },
//       },
//     );
//   }
// }

// src/app/ci-internal/dev-beacon/tenant-resolution-checkup/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// import { NextRequest, NextResponse } from "next/server";
import { NextResponse } from "next/server";
import { appGetDevBeaconAccess, appGetCoreConfig } from "@/kernel/server";

import {
  CI_DEFAULT_ORG_UNIT_OPTIONS,
  CI_DEFAULT_TENANT_ROUTING_OPTIONS,
  CI_DEV_TENANT_RESOLUTION_PROBES,
  ciNormalizePathname,
  ciNormalizeThrownError,
} from "@cloudigniter/core/lib";

import type {
  CiDevTenantResolutionCheckup,
  CiOrgUnitContext,
  CiTenantContext,
  CiTenantMode,
  CiTenantRoutingOptions,
} from "@cloudigniter/core/types";

import { ciResolveOrgUnitContext, ciResolveTenantContext } from "@cloudigniter/next/server";

type CiRequestLike = Pick<Request, "headers" | "url">;

type CiDevResolutionCheck = CiDevTenantResolutionCheckup["checks"][number];

type CiCheckArea = CiDevResolutionCheck["area"];

type CiCheckOutcome = {
  passed: boolean;
  message: string;
  actual: Record<string, unknown>;
};

type CiTenantProbeExpected = {
  id: string | null;
  scope: CiTenantContext["scope"];
  status: CiTenantContext["status"];
  exists: boolean;
};

type CiOrgUnitProbeExpectedContext = Pick<CiOrgUnitContext, "id" | "tenantId" | "slug" | "path" | "status">;

type CiOrgUnitProbeScenario = {
  id: string;
  label: string;
  path: string;
  expectedOrgUnit: CiOrgUnitProbeExpectedContext | null;
};

const CI_PROBE_FEATURE_PATHNAME = "/dashboard";

function ciGetOrgUnitProbeScenarios(): CiOrgUnitProbeScenario[] {
  return [
    {
      id: "org-unit-active-root",
      label: "Active root Org Unit",
      path: CI_DEV_TENANT_RESOLUTION_PROBES.orgUnit.root,
      expectedOrgUnit: {
        id: "ci_probe_org_6f7a2d91_root",
        tenantId: CI_DEV_TENANT_RESOLUTION_PROBES.tenant.active,
        slug: "ci-probe-org-6f7a2d91-root",
        path: CI_DEV_TENANT_RESOLUTION_PROBES.orgUnit.root,
        status: "active",
      },
    },
    {
      id: "org-unit-active-deep",
      label: "Deep active Org Unit",
      path: CI_DEV_TENANT_RESOLUTION_PROBES.orgUnit.deep,
      expectedOrgUnit: {
        id: "ci_probe_org_6f7a2d91_leaf_6ac0",
        tenantId: CI_DEV_TENANT_RESOLUTION_PROBES.tenant.active,
        slug: "leaf-6ac0",
        path: CI_DEV_TENANT_RESOLUTION_PROBES.orgUnit.deep,
        status: "active",
      },
    },
    {
      id: "org-unit-missing",
      label: "Missing Org Unit",
      path: CI_DEV_TENANT_RESOLUTION_PROBES.orgUnit.missing,
      expectedOrgUnit: null,
    },
    {
      id: "org-unit-suspended",
      label: "Suspended Org Unit",
      path: CI_DEV_TENANT_RESOLUTION_PROBES.orgUnit.suspended,
      expectedOrgUnit: {
        id: "ci_probe_org_6f7a2d91_suspended",
        tenantId: CI_DEV_TENANT_RESOLUTION_PROBES.tenant.active,
        slug: "ci-probe-org-6f7a2d91-suspended",
        path: CI_DEV_TENANT_RESOLUTION_PROBES.orgUnit.suspended,
        status: "suspended",
      },
    },
    {
      id: "org-unit-archived",
      label: "Archived Org Unit",
      path: CI_DEV_TENANT_RESOLUTION_PROBES.orgUnit.archived,
      expectedOrgUnit: {
        id: "ci_probe_org_6f7a2d91_archived",
        tenantId: CI_DEV_TENANT_RESOLUTION_PROBES.tenant.active,
        slug: "ci-probe-org-6f7a2d91-archived",
        path: CI_DEV_TENANT_RESOLUTION_PROBES.orgUnit.archived,
        status: "archived",
      },
    },
  ];
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    return await ciRunTenantResolutionCheckup(request);
  } catch (error: unknown) {
    const normalizedError = ciNormalizeThrownError(error);

    console.error("[tenant-resolution-checkup] Route failed:", normalizedError);

    return NextResponse.json(
      {
        error: "Tenant resolution checkup failed.",
        message: normalizedError.message,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

/**
 * Runs development-only Tenant and Org Unit resolution checks against the
 * real internal lookup endpoints and their configured data source.
 *
 * This endpoint is intentionally unavailable when the Dev Beacon is disabled
 * or when the application runs in production mode.
 */
export async function ciRunTenantResolutionCheckup(request: Request) {
  const orgUnitProbeScenarios = ciGetOrgUnitProbeScenarios();

  const appConfig = appGetCoreConfig();

  const devBeaconAccess = await appGetDevBeaconAccess(appConfig.dev?.debug?.devBeacon);

  /**
   * Return 404 rather than 401/403 so the developer-only endpoint is not
   * discoverable by unauthorized users.
   */
  if (!devBeaconAccess.allowed) {
    return new NextResponse(null, { status: 404 });
  }

  // const envMode = (process.env.CI_ENV_MODE ??
  //   process.env.NEXT_PUBLIC_CI_ENV_MODE ??
  //   "test") as CiEnvMode;

  const configuredTenantRouting = appConfig.tenant as CiTenantRoutingOptions | undefined;

  if (!configuredTenantRouting?.enabled) {
    return ciCheckupResponse(
      ciCreateConfigurationFailureCheckup("Tenant routing is disabled in the active application configuration."),
    );
  }

  /**
   * Tenant validation is forced for this diagnostic endpoint so the probe can
   * verify active, missing, suspended, and archived tenant scenarios even
   * when normal request routing uses validateTenant: false.
   */
  const tenantRoutingConfig = {
    ...CI_DEFAULT_TENANT_ROUTING_OPTIONS,
    ...configuredTenantRouting,
    validateTenant: true,
    orgUnit: {
      ...CI_DEFAULT_ORG_UNIT_OPTIONS,
      ...(configuredTenantRouting.orgUnit ?? {}),
    },
  } as CiTenantRoutingOptions;

  const checks: CiDevResolutionCheck[] = [];

  const activeTenantProbe = await ciRunTenantProbe({
    request,
    tenantRoutingConfig,
    id: "tenant-active",
    label: "Active Tenant",
    tenantSegment: CI_DEV_TENANT_RESOLUTION_PROBES.tenant.active,
    expected: {
      id: CI_DEV_TENANT_RESOLUTION_PROBES.tenant.active,
      scope: "tenant",
      status: "active",
      exists: true,
    },
  });

  checks.push(activeTenantProbe.check);

  checks.push(
    (
      await ciRunTenantProbe({
        request,
        tenantRoutingConfig,
        id: "tenant-missing",
        label: "Missing Tenant",
        tenantSegment: CI_DEV_TENANT_RESOLUTION_PROBES.tenant.missing,
        expected: {
          id: CI_DEV_TENANT_RESOLUTION_PROBES.tenant.missing,
          scope: "tenant",
          status: "active",
          exists: false,
        },
      })
    ).check,
  );

  checks.push(
    (
      await ciRunTenantProbe({
        request,
        tenantRoutingConfig,
        id: "tenant-suspended",
        label: "Suspended Tenant",
        tenantSegment: CI_DEV_TENANT_RESOLUTION_PROBES.tenant.suspended,
        expected: {
          id: CI_DEV_TENANT_RESOLUTION_PROBES.tenant.suspended,
          scope: "tenant",
          status: "suspended",
          exists: true,
        },
      })
    ).check,
  );

  checks.push(
    (
      await ciRunTenantProbe({
        request,
        tenantRoutingConfig,
        id: "tenant-archived",
        label: "Archived Tenant",
        tenantSegment: CI_DEV_TENANT_RESOLUTION_PROBES.tenant.archived,
        expected: {
          id: CI_DEV_TENANT_RESOLUTION_PROBES.tenant.archived,
          scope: "tenant",
          status: "archived",
          exists: true,
        },
      })
    ).check,
  );

  checks.push(
    (
      await ciRunTenantProbe({
        request,
        tenantRoutingConfig,
        id: "tenant-global",
        label: "Global Scope",
        tenantSegment: "global",
        expected: {
          id: null,
          scope: "global",
          status: "active",
          exists: true,
        },
      })
    ).check,
  );

  const orgUnitEnabled = tenantRoutingConfig.orgUnit?.enabled === true;

  if (!orgUnitEnabled) {
    for (const scenario of orgUnitProbeScenarios) {
      const featurePathname = ciNormalizePathname(`${scenario.path}${CI_PROBE_FEATURE_PATHNAME}`);

      const probeRequest = ciCreateProbeRequest({
        request,
        tenantRoutingConfig,
        tenantSegment: CI_DEV_TENANT_RESOLUTION_PROBES.tenant.active,
        featurePathname,
      });

      const pathname = ciGetRequestPathname(probeRequest);

      checks.push(
        ciCreateFailedCheck({
          id: scenario.id,
          area: "orgUnit",
          label: scenario.label,
          pathname,
          message: "Org Unit routing is disabled in the active application configuration.",
          expected: ciCreateExpectedOrgUnitSnapshot({
            scenario,
            pathname,
          }),
          actual: {
            pathname,
            orgUnit: null,
            featurePathname,
          },
        }),
      );
    }
  } else if (activeTenantProbe.check.state !== "passed" || !activeTenantProbe.context) {
    for (const scenario of orgUnitProbeScenarios) {
      const featurePathname = ciNormalizePathname(`${scenario.path}${CI_PROBE_FEATURE_PATHNAME}`);

      const probeRequest = ciCreateProbeRequest({
        request,
        tenantRoutingConfig,
        tenantSegment: CI_DEV_TENANT_RESOLUTION_PROBES.tenant.active,
        featurePathname,
      });

      const pathname = ciGetRequestPathname(probeRequest);

      checks.push(
        ciCreateFailedCheck({
          id: scenario.id,
          area: "orgUnit",
          label: scenario.label,
          pathname,
          message: "The active Tenant probe did not resolve, so Org Unit resolution could not be verified.",
          expected: ciCreateExpectedOrgUnitSnapshot({
            scenario,
            pathname,
          }),
          actual: {
            pathname,
            orgUnit: null,
            featurePathname,
          },
        }),
      );
    }
  } else {
    for (const scenario of orgUnitProbeScenarios) {
      checks.push(
        await ciRunOrgUnitProbe({
          request,
          tenantRoutingConfig,
          tenantContext: activeTenantProbe.context,
          scenario,
        }),
      );
    }
  }

  console.table(
    checks.map((check) => ({
      id: check.id,
      area: check.area,
      state: check.state,
      message: check.message,
      expected: JSON.stringify(check.expected),
      actual: JSON.stringify(check.actual),
    })),
  );

  return ciCheckupResponse(ciCreateCheckup(checks));
}

async function ciRunTenantProbe({
  request,
  tenantRoutingConfig,
  id,
  label,
  tenantSegment,
  expected,
}: {
  request: CiRequestLike;
  tenantRoutingConfig: CiTenantRoutingOptions;
  id: string;
  label: string;
  tenantSegment: string;
  expected: CiTenantProbeExpected;
}): Promise<{
  check: CiDevResolutionCheck;
  context: CiTenantContext | null;
}> {
  let resolvedContext: CiTenantContext | null = null;

  const probeRequest = ciCreateProbeRequest({
    request,
    tenantRoutingConfig,
    tenantSegment,
    featurePathname: CI_PROBE_FEATURE_PATHNAME,
  });

  const mode: CiTenantMode = tenantRoutingConfig.mode ?? "slug";

  const probePathname = ciGetRequestPathname(probeRequest);

  const expectedSnapshot = ciCreateTenantProbeSnapshot({
    expected,
    mode,
    pathname: probePathname,
  });

  const check = await ciRunCheck({
    id,
    area: "tenant",
    label,
    pathname: probePathname,
    expected: expectedSnapshot,
    run: async () => {
      const result = await ciResolveTenantContext({
        request: probeRequest,
        pathnameNormalized: probePathname,
        tenantRoutingConfig,
      });

      resolvedContext = result.tenant;

      const actualSnapshot = ciSnapshotTenantContext(result.tenant);

      const passed = ciAreResolutionSnapshotsEqual(expectedSnapshot, actualSnapshot);

      return {
        passed,
        actual: actualSnapshot,
        message: passed
          ? "Tenant context resolved as expected."
          : "Resolved Tenant context does not match the expected probe state.",
      };
    },
  });

  return {
    check,
    context: check.state === "passed" ? resolvedContext : null,
  };
}

function ciCreateExpectedOrgUnitSnapshot({
  scenario,
  pathname,
}: {
  scenario: CiOrgUnitProbeScenario;
  pathname: string;
}): Record<string, unknown> {
  const originalFeaturePathname = ciNormalizePathname(`${scenario.path}${CI_PROBE_FEATURE_PATHNAME}`);

  return ciSnapshotOrgUnitResolution({
    pathname,
    orgUnit: scenario.expectedOrgUnit,
    featurePathname: scenario.expectedOrgUnit === null ? originalFeaturePathname : CI_PROBE_FEATURE_PATHNAME,
  });
}

async function ciRunOrgUnitProbe({
  request,
  tenantRoutingConfig,
  tenantContext,
  scenario,
}: {
  request: CiRequestLike;
  tenantRoutingConfig: CiTenantRoutingOptions;
  tenantContext: CiTenantContext;
  scenario: CiOrgUnitProbeScenario;
}): Promise<CiDevResolutionCheck> {
  const featurePathname = ciNormalizePathname(`${scenario.path}${CI_PROBE_FEATURE_PATHNAME}`);

  const probeRequest = ciCreateProbeRequest({
    request,
    tenantRoutingConfig,
    tenantSegment: CI_DEV_TENANT_RESOLUTION_PROBES.tenant.active,
    featurePathname,
  });

  const probePathname = ciGetRequestPathname(probeRequest);

  const expectedSnapshot = ciCreateExpectedOrgUnitSnapshot({
    scenario,
    pathname: probePathname,
  });

  return ciRunCheck({
    id: scenario.id,
    area: "orgUnit",
    label: scenario.label,
    pathname: probePathname,
    expected: expectedSnapshot,
    run: async () => {
      const result = await ciResolveOrgUnitContext({
        request: probeRequest,
        tenantContext,
        featurePathname,
        tenantRoutingConfig,
      });

      const actualSnapshot = ciSnapshotOrgUnitResolution({
        pathname: probePathname,
        orgUnit: result.orgUnit,
        featurePathname: result.featurePathname,
      });

      const passed = ciAreResolutionSnapshotsEqual(expectedSnapshot, actualSnapshot);

      return {
        passed,
        actual: actualSnapshot,
        message: passed
          ? "Org Unit resolution matched the expected probe state."
          : "Resolved Org Unit context does not match the expected probe state.",
      };
    },
  });
}

async function ciRunCheck({
  id,
  area,
  label,
  pathname,
  expected,
  run,
}: {
  id: string;
  area: CiCheckArea;
  label: string;
  pathname?: string;
  expected?: Record<string, unknown>;
  run: () => Promise<CiCheckOutcome>;
}): Promise<CiDevResolutionCheck> {
  try {
    const outcome = await run();

    return {
      id,
      area,
      label,
      pathname,
      state: outcome.passed ? "passed" : "failed",
      message: outcome.message,
      expected,
      actual: outcome.actual,
    };
  } catch (error: unknown) {
    const normalizedError = ciNormalizeThrownError(error);

    return ciCreateFailedCheck({
      id,
      area,
      label,
      pathname,
      expected,
      message: normalizedError.message,
      actual: {
        error: normalizedError.message,
      },
    });
  }
}

function ciCreateFailedCheck({
  id,
  area,
  label,
  pathname,
  message,
  expected,
  actual,
}: {
  id: string;
  area: CiCheckArea;
  label: string;
  pathname?: string;
  message: string;
  expected?: Record<string, unknown>;
  actual?: Record<string, unknown>;
}): CiDevResolutionCheck {
  return {
    id,
    area,
    label,
    pathname,
    state: "failed",
    message,
    expected,
    actual,
  };
}

function ciCreateProbeRequest({
  request,
  tenantRoutingConfig,
  tenantSegment,
  featurePathname,
}: {
  request: CiRequestLike;
  tenantRoutingConfig: CiTenantRoutingOptions;
  tenantSegment: string;
  featurePathname: string;
}): Request {
  const url = new URL(request.url);
  const headers = new Headers(request.headers);

  /*
   * The incoming request belongs to the DevBeacon endpoint. Its x-ci-* headers
   * describe that endpoint, not the synthetic probe pathname. Keeping them can
   * cause tenant resolution to reuse a context whose tenant id is null.
   */
  const derivedHeaderNames: string[] = [];

  headers.forEach((_value, name) => {
    if (name.toLowerCase().startsWith("x-ci-")) {
      derivedHeaderNames.push(name);
    }
  });

  for (const name of derivedHeaderNames) {
    headers.delete(name);
  }

  const normalizedFeaturePathname = ciNormalizePathname(featurePathname);

  if (tenantRoutingConfig.mode === "subdomain") {
    const rootHost = ciGetRootHost(request, tenantRoutingConfig.rootDomains);

    const probeHost = `${tenantSegment}.${rootHost}`;

    headers.set("host", probeHost);
    headers.set("x-forwarded-host", probeHost);

    url.host = probeHost;
    url.pathname = normalizedFeaturePathname;
  } else {
    url.pathname = ciBuildSlugProbePath(tenantRoutingConfig.basePath, tenantSegment, normalizedFeaturePathname);
  }

  url.search = "";

  return new Request(url.toString(), {
    method: "GET",
    headers,
  });
}

function ciBuildSlugProbePath(basePath: string | undefined, tenantSegment: string, featurePathname: string): string {
  const normalizedBasePath = basePath?.trim() ? ciNormalizePathname(basePath) : "";

  const safeBasePath = normalizedBasePath === "/" ? "" : normalizedBasePath;

  const normalizedFeaturePathname = ciNormalizePathname(featurePathname);

  return ciNormalizePathname(
    `${safeBasePath}/${tenantSegment}${normalizedFeaturePathname === "/" ? "" : normalizedFeaturePathname}`,
  );
}

function ciGetRootHost(request: CiRequestLike, rootDomains: string[] | undefined): string {
  const configuredRootDomain = rootDomains?.[0];

  if (!configuredRootDomain) {
    return new URL(request.url).host;
  }

  try {
    const rootDomainUrl = new URL(
      configuredRootDomain.includes("://") ? configuredRootDomain : `http://${configuredRootDomain}`,
    );

    return rootDomainUrl.host;
  } catch {
    return new URL(request.url).host;
  }
}

function ciCreateTenantProbeSnapshot({
  expected,
  mode,
  pathname,
}: {
  expected: CiTenantProbeExpected;
  mode: CiTenantMode;
  pathname: string;
}): Record<string, unknown> {
  return {
    id: expected.id,
    scope: expected.scope,
    mode,
    status: expected.status,
    exists: expected.exists,
    pathname,
  };
}

function ciSnapshotTenantContext(context: CiTenantContext): Record<string, unknown> {
  return {
    id: context.id ?? null,
    scope: context.scope,
    mode: context.mode,
    status: context.status,
    exists: context.exists,
    pathname: context.pathname,
  };
}

function ciSnapshotOrgUnitResolution({
  pathname,
  orgUnit,
  featurePathname,
}: {
  pathname: string;
  orgUnit: CiOrgUnitProbeExpectedContext | CiOrgUnitContext | null;
  featurePathname: string;
}): Record<string, unknown> {
  return {
    pathname,
    orgUnit: orgUnit
      ? {
          id: orgUnit.id,
          tenantId: orgUnit.tenantId,
          slug: orgUnit.slug,
          path: orgUnit.path,
          status: orgUnit.status,
        }
      : null,
    featurePathname,
  };
}

function ciCreateConfigurationFailureCheckup(message: string): CiDevTenantResolutionCheckup {
  return ciCreateCheckup([
    ciCreateFailedCheck({
      id: "tenant-routing-configuration",
      area: "tenant",
      label: "Tenant Routing Configuration",
      message,
    }),
    ciCreateFailedCheck({
      id: "org-unit-routing-configuration",
      area: "orgUnit",
      label: "Org Unit Routing Configuration",
      message,
    }),
  ]);
}

function ciCreateCheckup(checks: CiDevResolutionCheck[]): CiDevTenantResolutionCheckup {
  return {
    tenant: ciCreateAreaSummary(checks, "tenant"),
    orgUnit: ciCreateAreaSummary(checks, "orgUnit"),
    checks,
  };
}

function ciCreateAreaSummary(checks: CiDevResolutionCheck[], area: CiCheckArea) {
  const areaChecks = checks.filter((check) => check.area === area);

  return {
    passed: areaChecks.filter((check) => check.state === "passed").length,
    failed: areaChecks.filter((check) => check.state === "failed").length,
    total: areaChecks.length,
  };
}

function ciCheckupResponse(checkup: CiDevTenantResolutionCheckup): NextResponse {
  return NextResponse.json(checkup, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function ciAreResolutionSnapshotsEqual(expected: Record<string, unknown>, actual: Record<string, unknown>): boolean {
  return JSON.stringify(expected) === JSON.stringify(actual);
}

function ciGetRequestPathname(request: CiRequestLike): string {
  return new URL(request.url).pathname;
}
