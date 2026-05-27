import { NextResponse } from "next/server";
import { ciNormalizePath } from "@cloudigniter/core/lib";
import type { CiNextProxyResponseInterface } from "./types";
import { ciGetBypassFlag } from "./helpers";
import { ciHandleRouteLogic } from "./ci-handle-route-logic";
import { ciHandleTenantLogic } from "./ci-handle-tenant-logic";

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
  ciConfig,
  routes,
}: CiNextProxyResponseInterface) {
  let response = NextResponse.next();

  const pathnameNormalized = ciNormalizePath(request.nextUrl.pathname);

  const bypass = ciGetBypassFlag(pathnameNormalized);

  if (bypass) {
    return response;
  }

  // -----------------------------
  // Route validation step
  // -----------------------------
  const resultPath = await ciHandleRouteLogic({
    request,
    response,
    pathnameNormalized,
    ciConfig,
    routes,
  });
  if (resultPath.exit) {
    return resultPath.response;
  }
  const responseAfterPathCheck = resultPath.response;
  // -----------------------------

  // -----------------------------
  // CiTenant validation step
  // -----------------------------
  const resultTenant = await ciHandleTenantLogic({
    request,
    response: responseAfterPathCheck,
    pathnameNormalized,
    ciConfig,
  });

  if (resultTenant.exit) {
    return resultTenant.response;
  }

  const responseAfterTenantCheck = resultTenant.response;
  // -----------------------------

  return responseAfterTenantCheck;
}
