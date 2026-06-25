import type { NextRequest, NextResponse } from "next/server";

import { CI_DEFAULT_ORG_UNIT_OPTIONS } from "@cloudigniter/core/lib";

import type {
  CiOrgUnitContext,
  CiOrgUnitRoutingOptions,
  CiTenantRoutingOptions,
} from "@cloudigniter/core/types";

/**
 * Writes canonical Org Unit context to response headers and, optionally, cookies.
 *
 * Response headers are always written.
 * Forwarded request headers are written when supplied, making the resolved
 * context available to Server Components during the current request.
 * Cookies are written only when enabled by configuration.
 *
 * When no Org Unit is resolved, the existing Org Unit context is cleared.
 */
export function ciWriteOrgUnitContext({
  request,
  response,
  requestHeaders,
  context,
  tenantRoutingConfig,
}: {
  request: NextRequest;
  response: NextResponse;
  requestHeaders?: Headers;
  context: CiOrgUnitContext | null;
  tenantRoutingConfig: CiTenantRoutingOptions;
}): NextResponse {
  const orgUnitOpts = {
    ...CI_DEFAULT_ORG_UNIT_OPTIONS,
    ...(tenantRoutingConfig.orgUnit ?? {}),
  } as Required<CiOrgUnitRoutingOptions>;

  const id = context?.id ?? "";
  const slug = context?.slug ?? "";
  const path = context?.path ?? "";
  const status = context?.status ?? "";

  response.headers.set(orgUnitOpts.idHeaderName, id);
  response.headers.set(orgUnitOpts.slugHeaderName, slug);
  response.headers.set(orgUnitOpts.pathHeaderName, path);
  response.headers.set(orgUnitOpts.statusHeaderName, status);

  requestHeaders?.set(orgUnitOpts.idHeaderName, id);
  requestHeaders?.set(orgUnitOpts.slugHeaderName, slug);
  requestHeaders?.set(orgUnitOpts.pathHeaderName, path);
  requestHeaders?.set(orgUnitOpts.statusHeaderName, status);

  if (!orgUnitOpts.writeOrgUnitCookie) {
    return response;
  }

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

  setCookieIfChanged(orgUnitOpts.idCookieName, id);
  setCookieIfChanged(orgUnitOpts.slugCookieName, slug);
  setCookieIfChanged(orgUnitOpts.pathCookieName, path);
  setCookieIfChanged(orgUnitOpts.statusCookieName, status);

  return response;
}
