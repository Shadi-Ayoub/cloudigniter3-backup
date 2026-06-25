/**
 * /t/acme/dashboard → /ci-tenant/dashboard
 * context = {
 *   tenant: {
 *     id: "acme",
 *     scope: "tenant",
 *     mode: "slug",
 *     status: "active",
 *     exists: true,
 *   },
 *   orgUnit: null,
 * }
 *
 * /t/acme/academic/grade-10/math/dashboard → /ci-tenant/dashboard
 * context = {
 *   tenant: {
 *     id: "acme",
 *     scope: "tenant",
 *     mode: "slug",
 *     status: "active",
 *     exists: true,
 *   },
 *   orgUnit: {
 *     path: "/academic/grade-10/math",
 *     slug: "math",
 *     status: "active",
 *   },
 * }
 *
 * acme.example.com/dashboard → /ci-tenant/dashboard
 * /t/global/dashboard → /ci-global/dashboard
 * global.example.com/dashboard → /ci-global/dashboard
 *
 * Expected internal app structure:
 * app/
 *   (system)/
 *     login/
 *     tenant/
 *       not-found/
 *       suspended/
 *
 *   (ci-global)/
 *     ci-global/
 *       layout.tsx
 *       dashboard/
 *         page.tsx
 *
 *   (ci-tenant)/
 *     ci-tenant/
 *       layout.tsx
 *       dashboard/
 *         page.tsx
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  CI_DEFAULT_ORG_UNIT_OPTIONS,
  CI_DEFAULT_TENANT_HEADERS,
  CI_DEFAULT_TENANT_ROUTING_OPTIONS,
  ciNormalizePathname,
} from "@cloudigniter/core/lib";

import type {
  CiOrgUnitContext,
  CiOrgUnitRoutingOptions,
  CiTenantContext,
  CiTenantRoutingOptions,
} from "@cloudigniter/core/types";

import {
  ciResolveOrgUnitContext,
  ciWriteOrgUnitContext,
} from "@ci-next/server";

import { ciRewriteToTenantInfoPage } from "./helpers";
import { ciResolveTenantContext } from "./ci-resolve-tenant-context";
import { ciWriteTenantContext } from "./ci-write-tenant-context";

interface CiHandleTenantLogicParams {
  request: NextRequest;
  response: NextResponse;
  pathnameNormalized: string;
  tenantRoutingConfig: CiTenantRoutingOptions;
}

type CiHandleTenantLogicResult =
  | {
      tenant: CiTenantContext;
      orgUnit: CiOrgUnitContext | null;
      response: NextResponse;
      exit: true;
    }
  | {
      tenant: CiTenantContext;
      orgUnit: CiOrgUnitContext | null;
      featurePathname: string;
      requestHeaders: Headers;
      response: NextResponse;
      exit: false;
    };

/**
 * Handles Tenant and Org Unit resolution, context persistence, and status routing.
 *
 * Final internal Tenant route rewriting happens only after logical route
 * validation in ciNextProxyResponse().
 */
export async function ciHandleTenantLogic({
  request,
  response,
  pathnameNormalized,
  tenantRoutingConfig,
}: CiHandleTenantLogicParams): Promise<CiHandleTenantLogicResult> {
  const tOpts = {
    ...CI_DEFAULT_TENANT_ROUTING_OPTIONS,
    ...(tenantRoutingConfig ?? {}),
  } as Required<CiTenantRoutingOptions>;

  const orgUnitOpts = {
    ...CI_DEFAULT_ORG_UNIT_OPTIONS,
    ...(tOpts.orgUnit ?? {}),
  } as Required<CiOrgUnitRoutingOptions>;

  /**
   * Request headers forwarded to the final rewritten or continued request.
   *
   * This makes the canonical Tenant and Org Unit context available to Server
   * Components during the current request cycle.
   */
  const requestHeaders = new Headers(request.headers);

  const tenant = await ciResolveTenantContext({
    request,
    pathnameNormalized,
    tenantRoutingConfig: tOpts,
  });

  let responseWithContext = ciWriteTenantContext({
    request,
    response,
    requestHeaders,
    context: tenant,
    tenantRoutingConfig: tOpts,
  });

  /**
   * Clear any prior Org Unit context before handling Tenant-level exits.
   *
   * This prevents stale Org Unit values from a previous request being exposed
   * on Tenant informational pages.
   */
  responseWithContext = ciWriteOrgUnitContext({
    request,
    response: responseWithContext,
    requestHeaders,
    context: null,
    tenantRoutingConfig: tOpts,
  });

  /**
   * Tenant does not exist.
   */
  if (tenant.scope === "tenant" && !tenant.exists) {
    const rewritten = ciRewriteToTenantInfoPage(
      request,
      tOpts.notFoundPath,
      tenant.id ?? "",
      tenant.scope,
      tOpts,
      responseWithContext,
      requestHeaders,
    );

    return {
      tenant,
      orgUnit: null,
      response: rewritten,
      exit: true,
    };
  }

  /**
   * Tenant is suspended.
   */
  if (tenant.scope === "tenant" && tenant.status === "suspended") {
    const rewritten = ciRewriteToTenantInfoPage(
      request,
      tOpts.suspendedPath,
      tenant.id ?? "",
      tenant.scope,
      tOpts,
      responseWithContext,
      requestHeaders,
    );

    return {
      tenant,
      orgUnit: null,
      response: rewritten,
      exit: true,
    };
  }

  /**
   * Tenant is archived.
   *
   * You can add tOpts.archivedPath later.
   * For now, suspendedPath can be used as a conservative fallback.
   */
  if (tenant.scope === "tenant" && tenant.status === "archived") {
    const rewritten = ciRewriteToTenantInfoPage(
      request,
      tOpts.suspendedPath,
      tenant.id ?? "",
      tenant.scope,
      tOpts,
      responseWithContext,
      requestHeaders,
    );

    return {
      tenant,
      orgUnit: null,
      response: rewritten,
      exit: true,
    };
  }

  /**
   * Resolve the remaining application pathname after removing the external
   * Tenant routing prefix, before resolving a possible Org Unit path.
   */
  let featurePathname = ciResolveTenantRemainingPath({
    pathname: request.nextUrl.pathname,
    tenant,
    tenantRoutingConfig: tOpts,
  });

  const orgUnitResolution = await ciResolveOrgUnitContext({
    request,
    tenantContext: tenant,
    featurePathname,
    tenantRoutingConfig: tOpts,
  });

  const orgUnit = orgUnitResolution.orgUnit;
  featurePathname = orgUnitResolution.featurePathname;

  /**
   * Always write Org Unit context so a prior Org Unit cookie is cleared when
   * the current route resolves only to Tenant scope.
   */
  responseWithContext = ciWriteOrgUnitContext({
    request,
    response: responseWithContext,
    requestHeaders,
    context: orgUnit,
    tenantRoutingConfig: tOpts,
  });

  const featurePathnameHeaderName =
    tOpts.featurePathnameHeaderName ??
    CI_DEFAULT_TENANT_HEADERS.featurePathname;

  responseWithContext.headers.set(featurePathnameHeaderName, featurePathname);

  requestHeaders.set(featurePathnameHeaderName, featurePathname);

  /**
   * An unmatched Org Unit candidate is intentionally treated as a normal
   * feature route. With implicit longest-prefix matching, a path segment can
   * represent either an Org Unit path or a feature pathname.
   *
   * CloudIgniter therefore does not route unmatched Org Unit candidates to an
   * informational page unless a future explicit Org Unit route namespace or
   * route manifest introduces that distinction.
   */

  /**
   * Org Unit is suspended.
   */
  if (orgUnitOpts.enforceStatus && orgUnit?.status === "suspended") {
    const rewritten = ciRewriteToTenantInfoPage(
      request,
      orgUnitOpts.suspendedPath,
      tenant.id ?? "",
      tenant.scope,
      tOpts,
      responseWithContext,
      requestHeaders,
    );

    return {
      tenant,
      orgUnit,
      response: rewritten,
      exit: true,
    };
  }

  /**
   * Org Unit is archived.
   *
   * You can add orgUnitOpts.archivedPath later.
   * For now, suspendedPath can be used as a conservative fallback.
   */
  if (orgUnitOpts.enforceStatus && orgUnit?.status === "archived") {
    const rewritten = ciRewriteToTenantInfoPage(
      request,
      orgUnitOpts.suspendedPath,
      tenant.id ?? "",
      tenant.scope,
      tOpts,
      responseWithContext,
      requestHeaders,
    );

    return {
      tenant,
      orgUnit,
      response: rewritten,
      exit: true,
    };
  }

  /**
   * Tenant and Org Unit resolution completed successfully.
   *
   * The final internal rewrite happens after logical route validation in
   * ciNextProxyResponse().
   */
  return {
    tenant,
    orgUnit,
    featurePathname,
    requestHeaders,
    response: responseWithContext,
    exit: false,
  };
}

/**
 * Resolves the remaining application pathname after removing the external
 * Tenant routing prefix.
 *
 * Org Unit path removal is performed separately by ciResolveOrgUnitContext().
 */
/**
 * Resolves the remaining application pathname after removing the external
 * Tenant routing prefix.
 *
 * Org Unit path removal is performed separately by ciResolveOrgUnitContext().
 */
function ciResolveTenantRemainingPath({
  pathname,
  tenant,
  tenantRoutingConfig,
}: {
  pathname: string;
  tenant: CiTenantContext;
  tenantRoutingConfig: Required<CiTenantRoutingOptions>;
}): string {
  const normalizedPathname = ciNormalizePathname(pathname);

  /**
   * Only Tenant and Global slug-routed requests contain an external routing
   * prefix that needs to be removed.
   *
   * System routes must remain unchanged.
   */
  if (
    tenant.mode !== "slug" ||
    (tenant.scope !== "tenant" && tenant.scope !== "global")
  ) {
    return normalizedPathname;
  }

  /**
   * An empty base path supports root-based slug routing:
   *
   * /acme/dashboard -> /dashboard
   */
  const rawBasePath = tenantRoutingConfig.basePath.trim();

  const basePath = rawBasePath ? ciNormalizePathname(rawBasePath) : "";

  const pathnameSegments = normalizedPathname.split("/").filter(Boolean);
  const basePathSegments = basePath.split("/").filter(Boolean);

  /**
   * Do not strip segments unless the request starts with the configured
   * slug-routing base path.
   */
  const matchesBasePath = basePathSegments.every(
    (segment, index) => pathnameSegments[index] === segment,
  );

  if (!matchesBasePath) {
    return normalizedPathname;
  }

  /**
   * Remove:
   * - configured base path segments
   * - one Tenant or Global identifier segment
   *
   * Examples when basePath is "/tx":
   * /tx/acme/dashboard   -> /dashboard
   * /tx/global/dashboard -> /dashboard
   */
  return ciNormalizePathname(
    `/${pathnameSegments.slice(basePathSegments.length + 1).join("/")}`,
  );
}
