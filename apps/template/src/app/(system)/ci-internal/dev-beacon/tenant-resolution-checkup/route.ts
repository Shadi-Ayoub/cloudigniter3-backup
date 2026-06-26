// src/app/ci-internal/dev-beacon/tenant-resolution-checkup/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { appGetDevBeaconAccess, appGetServerAllConfig } from "@/kernel/server";

import {
  CI_DEFAULT_ORG_UNIT_OPTIONS,
  CI_DEFAULT_TENANT_ROUTING_OPTIONS,
  CI_DEV_TENANT_RESOLUTION_PROBES,
  ciNormalizePathname,
  ciNormalizeThrownError,
} from "@ci-core/lib";

import type {
  CiDevTenantResolutionCheckup,
  CiEnvMode,
  CiOrgUnitStatus,
  CiResolveOrgUnitResult,
  CiTenantContext,
  CiTenantRoutingOptions,
} from "@cloudigniter/core/types";

import {
  ciResolveOrgUnitContext,
  ciResolveTenantContext,
} from "@cloudigniter/next/server";

type CiDevResolutionCheck = CiDevTenantResolutionCheckup["checks"][number];

type CiCheckArea = CiDevResolutionCheck["area"];

type CiCheckOutcome = {
  passed: boolean;
  message: string;
  actual: Record<string, unknown>;
};

type CiOrgUnitProbeScenario = {
  id: string;
  label: string;
  path: string;
  expectedPath: string | null;
  expectedStatus?: CiOrgUnitStatus;
};

const CI_PROBE_FEATURE_PATHNAME = "/dashboard";

const CI_ORG_UNIT_PROBE_SCENARIOS: CiOrgUnitProbeScenario[] = [
  {
    id: "org-unit-active-root",
    label: "Active root Org Unit",
    path: CI_DEV_TENANT_RESOLUTION_PROBES.orgUnit.root,
    expectedPath: CI_DEV_TENANT_RESOLUTION_PROBES.orgUnit.root,
    expectedStatus: "active",
  },
  {
    id: "org-unit-active-deep",
    label: "Deep active Org Unit",
    path: CI_DEV_TENANT_RESOLUTION_PROBES.orgUnit.deep,
    expectedPath: CI_DEV_TENANT_RESOLUTION_PROBES.orgUnit.deep,
    expectedStatus: "active",
  },
  {
    id: "org-unit-missing",
    label: "Missing Org Unit",
    path: CI_DEV_TENANT_RESOLUTION_PROBES.orgUnit.missing,
    expectedPath: null,
  },
  {
    id: "org-unit-suspended",
    label: "Suspended Org Unit",
    path: CI_DEV_TENANT_RESOLUTION_PROBES.orgUnit.suspended,
    expectedPath: CI_DEV_TENANT_RESOLUTION_PROBES.orgUnit.suspended,
    expectedStatus: "suspended",
  },
  {
    id: "org-unit-archived",
    label: "Archived Org Unit",
    path: CI_DEV_TENANT_RESOLUTION_PROBES.orgUnit.archived,
    expectedPath: CI_DEV_TENANT_RESOLUTION_PROBES.orgUnit.archived,
    expectedStatus: "archived",
  },
];

/**
 * Runs development-only Tenant and Org Unit resolution checks against the
 * real internal lookup endpoints and their configured data source.
 *
 * This endpoint is intentionally unavailable when the Dev Beacon is disabled
 * or when the application runs in production mode.
 */
export async function GET(request: NextRequest) {
  const appConfig = await appGetServerAllConfig();

  const devBeaconAccess = await appGetDevBeaconAccess(
    appConfig.dev?.debug?.devBeacon,
  );

  /**
   * Return 404 rather than 401/403 so the developer-only endpoint is not
   * discoverable by unauthorized users.
   */
  if (!devBeaconAccess.allowed) {
    return new NextResponse(null, { status: 404 });
  }

  const envMode = (process.env.CI_ENV_MODE ??
    process.env.NEXT_PUBLIC_CI_ENV_MODE ??
    "test") as CiEnvMode;

  const configuredTenantRouting = appConfig.tenant as
    | CiTenantRoutingOptions
    | undefined;

  if (!configuredTenantRouting?.enabled) {
    return ciCheckupResponse(
      ciCreateConfigurationFailureCheckup(
        "Tenant routing is disabled in the active application configuration.",
      ),
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
      scope: "tenant",
      id: CI_DEV_TENANT_RESOLUTION_PROBES.tenant.active,
      exists: true,
      status: "active",
    },
    verify: (context) =>
      context.scope === "tenant" &&
      context.id === CI_DEV_TENANT_RESOLUTION_PROBES.tenant.active &&
      context.exists === true &&
      context.status === "active",
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
          scope: "tenant",
          id: CI_DEV_TENANT_RESOLUTION_PROBES.tenant.missing,
          exists: false,
        },
        verify: (context) =>
          context.scope === "tenant" &&
          context.id === CI_DEV_TENANT_RESOLUTION_PROBES.tenant.missing &&
          context.exists === false,
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
          scope: "tenant",
          exists: true,
          status: "suspended",
        },
        verify: (context) =>
          context.scope === "tenant" &&
          context.exists === true &&
          context.status === "suspended",
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
          scope: "tenant",
          exists: true,
          status: "archived",
        },
        verify: (context) =>
          context.scope === "tenant" &&
          context.exists === true &&
          context.status === "archived",
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
          scope: "global",
          exists: true,
          status: "active",
        },
        verify: (context) =>
          context.scope === "global" &&
          context.exists === true &&
          context.status === "active",
      })
    ).check,
  );

  const orgUnitEnabled = tenantRoutingConfig.orgUnit?.enabled === true;

  if (!orgUnitEnabled) {
    for (const scenario of CI_ORG_UNIT_PROBE_SCENARIOS) {
      checks.push(
        ciCreateFailedCheck({
          id: scenario.id,
          area: "orgUnit",
          label: scenario.label,
          message:
            "Org Unit routing is disabled in the active application configuration.",
          expected: {
            orgUnitPath: scenario.expectedPath,
          },
        }),
      );
    }
  } else if (
    activeTenantProbe.check.state !== "passed" ||
    !activeTenantProbe.context
  ) {
    for (const scenario of CI_ORG_UNIT_PROBE_SCENARIOS) {
      checks.push(
        ciCreateFailedCheck({
          id: scenario.id,
          area: "orgUnit",
          label: scenario.label,
          message:
            "The active Tenant probe did not resolve, so Org Unit resolution could not be verified.",
        }),
      );
    }
  } else {
    for (const scenario of CI_ORG_UNIT_PROBE_SCENARIOS) {
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

  return ciCheckupResponse(ciCreateCheckup(checks));
}

async function ciRunTenantProbe({
  request,
  tenantRoutingConfig,
  id,
  label,
  tenantSegment,
  expected,
  verify,
}: {
  request: NextRequest;
  tenantRoutingConfig: CiTenantRoutingOptions;
  id: string;
  label: string;
  tenantSegment: string;
  expected: Record<string, unknown>;
  verify: (context: CiTenantContext) => boolean;
}): Promise<{
  check: CiDevResolutionCheck;
  context: CiTenantContext | null;
}> {
  let resolvedContext: CiTenantContext | null = null;

  const check = await ciRunCheck({
    id,
    area: "tenant",
    label,
    expected,
    run: async () => {
      const probeRequest = ciCreateProbeRequest({
        request,
        tenantRoutingConfig,
        tenantSegment,
        featurePathname: CI_PROBE_FEATURE_PATHNAME,
      });

      resolvedContext = await ciResolveTenantContext({
        request: probeRequest,
        pathnameNormalized: probeRequest.nextUrl.pathname,
        tenantRoutingConfig,
      });

      const actual = ciSnapshotTenantContext(resolvedContext);
      const passed = verify(resolvedContext);

      return {
        passed,
        actual,
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

async function ciRunOrgUnitProbe({
  request,
  tenantRoutingConfig,
  tenantContext,
  scenario,
}: {
  request: NextRequest;
  tenantRoutingConfig: CiTenantRoutingOptions;
  tenantContext: CiTenantContext;
  scenario: CiOrgUnitProbeScenario;
}): Promise<CiDevResolutionCheck> {
  const featurePathname = ciNormalizePathname(
    `${scenario.path}${CI_PROBE_FEATURE_PATHNAME}`,
  );

  return ciRunCheck({
    id: scenario.id,
    area: "orgUnit",
    label: scenario.label,
    expected: {
      orgUnitPath: scenario.expectedPath,
      status: scenario.expectedStatus ?? null,
      featurePathname:
        scenario.expectedPath === null
          ? featurePathname
          : CI_PROBE_FEATURE_PATHNAME,
    },
    run: async () => {
      const probeRequest = ciCreateProbeRequest({
        request,
        tenantRoutingConfig,
        tenantSegment: CI_DEV_TENANT_RESOLUTION_PROBES.tenant.active,
        featurePathname,
      });

      const result = await ciResolveOrgUnitContext({
        request: probeRequest,
        tenantContext,
        featurePathname,
        tenantRoutingConfig,
      });

      const actual = ciSnapshotOrgUnitResolution(result);

      const passed =
        scenario.expectedPath === null
          ? result.orgUnit === null &&
            result.featurePathname === featurePathname
          : result.orgUnit?.path === scenario.expectedPath &&
            result.orgUnit.status === scenario.expectedStatus &&
            result.featurePathname === CI_PROBE_FEATURE_PATHNAME;

      return {
        passed,
        actual,
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
  expected,
  run,
}: {
  id: string;
  area: CiCheckArea;
  label: string;
  expected?: Record<string, unknown>;
  run: () => Promise<CiCheckOutcome>;
}): Promise<CiDevResolutionCheck> {
  try {
    const outcome = await run();

    return {
      id,
      area,
      label,
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
  message,
  expected,
  actual,
}: {
  id: string;
  area: CiCheckArea;
  label: string;
  message: string;
  expected?: Record<string, unknown>;
  actual?: Record<string, unknown>;
}): CiDevResolutionCheck {
  return {
    id,
    area,
    label,
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
  request: NextRequest;
  tenantRoutingConfig: CiTenantRoutingOptions;
  tenantSegment: string;
  featurePathname: string;
}): NextRequest {
  const url = new URL(request.url);
  const headers = new Headers(request.headers);

  const normalizedFeaturePathname = ciNormalizePathname(featurePathname);

  if (tenantRoutingConfig.mode === "subdomain") {
    const rootHost = ciGetRootHost(request, tenantRoutingConfig.rootDomains);

    const probeHost = `${tenantSegment}.${rootHost}`;

    headers.set("host", probeHost);
    headers.set("x-forwarded-host", probeHost);

    url.pathname = normalizedFeaturePathname;
  } else {
    url.pathname = ciBuildSlugProbePath(
      tenantRoutingConfig.basePath,
      tenantSegment,
      normalizedFeaturePathname,
    );
  }

  url.search = "";

  return new NextRequest(url, {
    method: "GET",
    headers,
  });
}

function ciBuildSlugProbePath(
  basePath: string | undefined,
  tenantSegment: string,
  featurePathname: string,
): string {
  const normalizedBasePath = basePath?.trim()
    ? ciNormalizePathname(basePath)
    : "";

  const safeBasePath = normalizedBasePath === "/" ? "" : normalizedBasePath;

  const normalizedFeaturePathname = ciNormalizePathname(featurePathname);

  return ciNormalizePathname(
    `${safeBasePath}/${tenantSegment}${
      normalizedFeaturePathname === "/" ? "" : normalizedFeaturePathname
    }`,
  );
}

function ciGetRootHost(
  request: NextRequest,
  rootDomains: string[] | undefined,
): string {
  const configuredRootDomain = rootDomains?.[0];

  if (!configuredRootDomain) {
    return new URL(request.url).host;
  }

  try {
    const rootDomainUrl = new URL(
      configuredRootDomain.includes("://")
        ? configuredRootDomain
        : `http://${configuredRootDomain}`,
    );

    return rootDomainUrl.host;
  } catch {
    return new URL(request.url).host;
  }
}

function ciSnapshotTenantContext(
  context: CiTenantContext,
): Record<string, unknown> {
  return {
    id: context.id ?? null,
    scope: context.scope,
    mode: context.mode,
    status: context.status,
    exists: context.exists,
    pathname: context.pathname,
  };
}

function ciSnapshotOrgUnitResolution(
  result: CiResolveOrgUnitResult,
): Record<string, unknown> {
  return {
    orgUnit: result.orgUnit
      ? {
          id: result.orgUnit.id,
          tenantId: result.orgUnit.tenantId,
          slug: result.orgUnit.slug,
          path: result.orgUnit.path,
          status: result.orgUnit.status,
        }
      : null,
    featurePathname: result.featurePathname,
  };
}

function ciCreateConfigurationFailureCheckup(
  message: string,
): CiDevTenantResolutionCheckup {
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

function ciCreateCheckup(
  checks: CiDevResolutionCheck[],
): CiDevTenantResolutionCheckup {
  return {
    tenant: ciCreateAreaSummary(checks, "tenant"),
    orgUnit: ciCreateAreaSummary(checks, "orgUnit"),
    checks,
  };
}

function ciCreateAreaSummary(
  checks: CiDevResolutionCheck[],
  area: CiCheckArea,
) {
  const areaChecks = checks.filter((check) => check.area === area);

  return {
    passed: areaChecks.filter((check) => check.state === "passed").length,
    failed: areaChecks.filter((check) => check.state === "failed").length,
    total: areaChecks.length,
  };
}

function ciCheckupResponse(
  checkup: CiDevTenantResolutionCheckup,
): NextResponse {
  return NextResponse.json(checkup, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
