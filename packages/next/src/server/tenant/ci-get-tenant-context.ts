import { cookies, headers } from "next/headers";

import {
  CI_DEFAULT_TENANT_COOKIES,
  CI_DEFAULT_TENANT_HEADERS,
  CI_DEFAULT_TENANT_ROUTING_OPTIONS,
} from "@cloudigniter/core/lib";

import type {
  CiTenantContext,
  CiTenantRoutingOptions,
} from "@cloudigniter/core/types";

import { ciNormalizeTenantScope, ciNormalizeTenantStatus } from "./helpers";

/**
 * Returns the canonical tenant context for the current server request.
 *
 * Resolution order:
 * 1. Request headers written by proxy/middleware.
 * 2. Tenant cookies written by proxy/middleware.
 * 3. Safe system-scope fallback.
 *
 * This function does not resolve tenants from the URL.
 * Tenant URL/subdomain resolution must happen in the proxy layer.
 */
export async function ciGetTenantContext(
  tenantRoutingConfig?: CiTenantRoutingOptions,
): Promise<CiTenantContext> {
  const tOpts = {
    ...CI_DEFAULT_TENANT_ROUTING_OPTIONS,
    ...(tenantRoutingConfig ?? {}),
  } as Required<CiTenantRoutingOptions>;

  const headerStore = await headers();
  const cookieStore = await cookies();

  const idHeaderName = tOpts.idHeaderName ?? CI_DEFAULT_TENANT_HEADERS.tenantId;
  const modeHeaderName =
    tOpts.modeHeaderName ?? CI_DEFAULT_TENANT_HEADERS.tenantMode;
  const scopeHeaderName =
    tOpts.scopeHeaderName ?? CI_DEFAULT_TENANT_HEADERS.tenantScope;
  const statusHeaderName =
    tOpts.statusHeaderName ?? CI_DEFAULT_TENANT_HEADERS.tenantStatus;

  const idCookieName = tOpts.idCookieName ?? CI_DEFAULT_TENANT_COOKIES.tenantId;
  const modeCookieName =
    tOpts.modeCookieName ?? CI_DEFAULT_TENANT_COOKIES.tenantMode;
  const scopeCookieName =
    tOpts.scopeCookieName ?? CI_DEFAULT_TENANT_COOKIES.tenantScope;
  const statusCookieName =
    tOpts.statusCookieName ?? CI_DEFAULT_TENANT_COOKIES.tenantStatus;

  const rawId =
    headerStore.get(idHeaderName) ??
    cookieStore.get(idCookieName)?.value ??
    undefined;

  const rawMode =
    headerStore.get(modeHeaderName) ??
    cookieStore.get(modeCookieName)?.value ??
    tOpts.mode;

  const rawScope =
    headerStore.get(scopeHeaderName) ??
    cookieStore.get(scopeCookieName)?.value ??
    "system";

  const rawStatus =
    headerStore.get(statusHeaderName) ??
    cookieStore.get(statusCookieName)?.value ??
    "active";

  const scope = ciNormalizeTenantScope(rawScope);
  const status = ciNormalizeTenantStatus(rawStatus);
  const mode = rawMode === "subdomain" ? "subdomain" : "slug";

  const id = scope === "tenant" && rawId ? rawId : undefined;

  return {
    id,
    scope,
    mode,
    status,
    exists: true,
    pathname: "",
  };
}
