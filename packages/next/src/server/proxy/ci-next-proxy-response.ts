import { NextResponse } from "next/server";

import {
  CI_DEFAULT_REQUEST_CONTEXT_COOKIE_NAME,
  CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME,
  CI_DEFAULT_TENANT_ROUTING_OPTIONS,
  ciNormalizePathname,
  ciSerializeRequestContext,
} from "@cloudigniter/core/lib";

import type { CiRequestContext, CiTenantRoutingOptions } from "@cloudigniter/core/types";

import type { CiNextProxyResponseInterface } from "./types";

import { ciGetBypassFlag, ciRewriteToRouteInfoPage } from "./helpers";
import { ciHandleRouteLogic } from "./ci-handle-route-logic";

import { ciHandleTenantLogic, ciRewriteTenantRoute } from "@ci-next/server";

/**
 * Resolves Tenant, Org Unit, and route context; enforces route access rules;
 * then rewrites Tenant-aware requests to their logical feature route.
 *
 * This function owns:
 *
 * - response construction;
 * - Tenant and Org Unit information-page navigation;
 * - authoritative CiRequestContext serialization;
 * - request-context header and cookie transport;
 * - the final internal Tenant-route rewrite.
 */
export async function ciNextProxyResponse({
  request,
  config,
  routes,
}: CiNextProxyResponseInterface): Promise<NextResponse> {
  const pathnameNormalized = ciNormalizePathname(request.nextUrl.pathname);

  const requestContextHeaderName = config.app?.requestContextHeaderName ?? CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME;

  const requestContextCookieName = config.app?.requestContextCookieName ?? CI_DEFAULT_REQUEST_CONTEXT_COOKIE_NAME;

  const bypass = ciGetBypassFlag(pathnameNormalized);

  if (bypass) {
    /*
     * Never allow caller-supplied internal request-context headers to reach
     * the application unchanged.
     */
    const requestHeaders = new Headers(request.headers);

    requestHeaders.delete(CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME);
    requestHeaders.delete(requestContextHeaderName);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const tenantRoutingOptions = {
    ...CI_DEFAULT_TENANT_ROUTING_OPTIONS,
    ...(config.tenant ?? {}),
  } as Required<CiTenantRoutingOptions>;

  // -------------------------------------------------------
  // Tenant and Org Unit resolution
  // -------------------------------------------------------
  const tenantResult = await ciHandleTenantLogic({
    request,
    pathnameNormalized,
    tenantRoutingOptions,
  });

  /*
   * Create the request context before route resolution, with route set to null.
   *
   * This allows Tenant, Org Unit, and invalid-route information pages to receive
   * the resolved context even when normal route resolution does not continue.
   */
  const unresolvedRequestContext: CiRequestContext = {
    schemaVersion: 1,
    tenant: tenantResult.tenant,
    orgUnit: tenantResult.orgUnit,
    featurePathname: tenantResult.featurePathname,
    route: null,
  };

  const serializedUnresolvedRequestContext = ciSerializeRequestContext(unresolvedRequestContext);

  const requestHeaders = new Headers(request.headers);

  /*
   * Remove both the default and configured header names before writing the
   * authoritative proxy-generated context and namespace.
   */
  // requestHeaders.delete(CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME);

  // requestHeaders.delete(requestContextHeaderName);

  // requestHeaders.set(requestContextHeaderName, serializedUnresolvedRequestContext);

  // -------------------------------------------------------
  // Tenant or Org Unit information-page response
  // -------------------------------------------------------
  if (tenantResult.action === "info") {
    const infoPageUrl = request.nextUrl.clone();

    infoPageUrl.pathname = ciNormalizePathname(tenantResult.infoPagePath);

    const infoResponse =
      tenantRoutingOptions.infoPageStrategy === "redirect"
        ? NextResponse.redirect(infoPageUrl)
        : NextResponse.rewrite(infoPageUrl, {
            request: {
              headers: requestHeaders,
            },
          });

    infoResponse.cookies.set(requestContextCookieName, serializedUnresolvedRequestContext, {
      path: "/",
      sameSite: "lax",
    });

    return infoResponse;
  }

  // -------------------------------------------------------
  // Route resolution and validation
  //
  // Resolve the logical feature pathname rather than the public
  // Tenant and Org Unit transport pathname.
  //
  // Example:
  // /tx/acme/academic/grade-10/math/dashboard -> /dashboard
  // -------------------------------------------------------
  // -------------------------------------------------------
  // Route resolution and validation
  // -------------------------------------------------------
  const routeResult = await ciHandleRouteLogic({
    request,
    pathnameNormalized: tenantResult.featurePathname,
    routes,
  });

  // -------------------------------------------------------
  // Unregistered route information page
  // -------------------------------------------------------
  if (routeResult.action === "route-info") {
    const routeInfoResponse = NextResponse.next();

    routeInfoResponse.cookies.set(requestContextCookieName, serializedUnresolvedRequestContext, {
      path: "/",
      sameSite: "lax",
    });

    return ciRewriteToRouteInfoPage(
      request,
      routeResult.details,
      {
        infoPagePath: config.route?.infoPagePath ?? "/ci-internal/route-info",

        infoPageStrategy: config.route?.infoPageStrategy ?? "rewrite",
      },
      routeInfoResponse,
      requestHeaders,
    );
  }

  /*
   * Both remaining result variants contain a fully resolved route.
   */
  const resolvedRequestContext: CiRequestContext = {
    ...unresolvedRequestContext,
    route: routeResult.route,
  };

  // -------------------------------------------------------
  // set request context header
  // -------------------------------------------------------
  const serializedResolvedRequestContext = ciSerializeRequestContext(resolvedRequestContext);
  const resolvedRequestHeaders = new Headers(requestHeaders);
  resolvedRequestHeaders.delete(CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME);
  resolvedRequestHeaders.delete(requestContextHeaderName);
  resolvedRequestHeaders.set(requestContextHeaderName, serializedResolvedRequestContext);

  // -------------------------------------------------------
  // Canonical or authentication redirect
  // -------------------------------------------------------
  if (routeResult.action === "redirect") {
    /*
     * A redirect creates a new browser request, so custom request headers cannot
     * be forwarded. Persist the context cookie for the subsequent request.
     */
    const redirectResponse = NextResponse.redirect(routeResult.destination);

    redirectResponse.cookies.set(requestContextCookieName, serializedResolvedRequestContext, {
      path: "/",
      sameSite: "lax",
    });

    return redirectResponse;
  }

  // -------------------------------------------------------
  // Continue with the final internal Tenant route rewrite
  // -------------------------------------------------------
  const response = ciRewriteTenantRoute({
    request,
    requestHeaders: resolvedRequestHeaders,
    tenant: tenantResult.tenant,
    featurePathname: tenantResult.featurePathname,
  });

  response.cookies.set(requestContextCookieName, serializedResolvedRequestContext, {
    path: "/",
    sameSite: "lax",
  });

  return response;
}
