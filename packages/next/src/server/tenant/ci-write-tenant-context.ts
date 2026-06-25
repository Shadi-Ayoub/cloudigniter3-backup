import type { NextRequest, NextResponse } from "next/server";

import type {
  CiTenantContext,
  CiTenantRoutingOptions,
} from "@cloudigniter/core/types";

import {
  CI_DEFAULT_TENANT_COOKIES,
  CI_DEFAULT_TENANT_HEADERS,
  CI_DEFAULT_TENANT_ROUTING_OPTIONS,
} from "@cloudigniter/core/lib";

/**
 * Writes canonical tenant context to response headers and, optionally, cookies.
 *
 * Response headers are always written.
 * Forwarded request headers are written when supplied, making the resolved
 * context available to Server Components during the current request.
 * Cookies are written only when enabled by configuration.
 */
export function ciWriteTenantContext({
  request,
  response,
  requestHeaders,
  context,
  tenantRoutingConfig,
}: {
  request: NextRequest;
  response: NextResponse;
  requestHeaders?: Headers;
  context: CiTenantContext;
  tenantRoutingConfig: CiTenantRoutingOptions;
}): NextResponse {
  const tOpts = {
    ...CI_DEFAULT_TENANT_ROUTING_OPTIONS,
    ...(tenantRoutingConfig ?? {}),
  } as Required<CiTenantRoutingOptions>;

  const idHeaderName = tOpts.idHeaderName ?? CI_DEFAULT_TENANT_HEADERS.tenantId;
  const modeHeaderName =
    tOpts.modeHeaderName ?? CI_DEFAULT_TENANT_HEADERS.tenantMode;
  const scopeHeaderName =
    tOpts.scopeHeaderName ?? CI_DEFAULT_TENANT_HEADERS.tenantScope;
  const statusHeaderName =
    tOpts.statusHeaderName ?? CI_DEFAULT_TENANT_HEADERS.tenantStatus;

  const tenantId = context.id ?? "";
  const tenantMode = context.mode;
  const tenantScope = context.scope;
  const tenantStatus = context.status;

  response.headers.set(idHeaderName, tenantId);
  response.headers.set(modeHeaderName, tenantMode);
  response.headers.set(scopeHeaderName, tenantScope);
  response.headers.set(statusHeaderName, tenantStatus);

  requestHeaders?.set(idHeaderName, tenantId);
  requestHeaders?.set(modeHeaderName, tenantMode);
  requestHeaders?.set(scopeHeaderName, tenantScope);
  requestHeaders?.set(statusHeaderName, tenantStatus);

  if (!tOpts.writeTenantCookie) {
    return response;
  }

  const idCookieName = tOpts.idCookieName ?? CI_DEFAULT_TENANT_COOKIES.tenantId;
  const modeCookieName =
    tOpts.modeCookieName ?? CI_DEFAULT_TENANT_COOKIES.tenantMode;
  const scopeCookieName =
    tOpts.scopeCookieName ?? CI_DEFAULT_TENANT_COOKIES.tenantScope;
  const statusCookieName =
    tOpts.statusCookieName ?? CI_DEFAULT_TENANT_COOKIES.tenantStatus;

  /**
   * Avoid unnecessary Set-Cookie headers when the value has not changed.
   */
  const setCookieIfChanged = (name: string, value: string): void => {
    if (request.cookies.get(name)?.value === value) return;

    response.cookies.set(name, value, {
      path: "/",
      sameSite: "lax",
    });
  };

  setCookieIfChanged(idCookieName, tenantId);
  setCookieIfChanged(modeCookieName, tenantMode);
  setCookieIfChanged(scopeCookieName, tenantScope);
  setCookieIfChanged(statusCookieName, tenantStatus);

  return response;
}
