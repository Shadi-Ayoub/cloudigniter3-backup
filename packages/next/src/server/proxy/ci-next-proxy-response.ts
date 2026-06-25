import { NextResponse } from "next/server";

import { ciNormalizePathname } from "@cloudigniter/core/lib";

import type { CiNextProxyResponseInterface } from "./types";

import { ciGetBypassFlag } from "./helpers";
import { ciHandleRouteLogic } from "./ci-handle-route-logic";

import { ciHandleTenantLogic, ciRewriteTenantRoute } from "@ci-next/server";

/**
 * Always resolve the request path string and store it in a cookie and in the response header.
 * Always protect protected paths from un-authorized users!
 * Always handles login route.
 * Always handles logout request.
 *
 * @param param0
 * @returns NextResponse
 */
export async function ciNextProxyResponse({
  request,
  routeConfig,
  tenantRoutingConfig,
  routes,
}: CiNextProxyResponseInterface): Promise<NextResponse> {
  const response = NextResponse.next();

  const pathnameNormalized = ciNormalizePathname(request.nextUrl.pathname);

  const bypass = ciGetBypassFlag(pathnameNormalized);

  if (bypass) {
    return response;
  }

  // -------------------------------------------------------
  // Tenant and Org Unit resolution step
  // -------------------------------------------------------
  const tenantResult = await ciHandleTenantLogic({
    request,
    response,
    pathnameNormalized,
    tenantRoutingConfig,
  });

  if (tenantResult.exit) {
    return tenantResult.response;
  }
  // -------------------------------------------------------

  // -------------------------------------------------------
  // Route validation step
  //
  // Validate the resolved logical feature pathname, not the public
  // Tenant transport pathname.
  //
  // Example:
  // /tx/acme/academic/grade-10/math/dashboard -> /dashboard
  // -------------------------------------------------------
  const routeResult = await ciHandleRouteLogic({
    request,
    response: tenantResult.response,
    pathnameNormalized: tenantResult.featurePathname ?? pathnameNormalized,
    routeConfig,
    routes,
  });

  if (routeResult.exit) {
    return routeResult.response;
  }
  // -------------------------------------------------------

  return ciRewriteTenantRoute({
    request,
    response: routeResult.response,
    requestHeaders: tenantResult.requestHeaders,
    tenant: tenantResult.tenant,
    featurePathname: tenantResult.featurePathname,
  });
}
