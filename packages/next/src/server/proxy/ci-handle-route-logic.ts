import type { NextRequest } from "next/server";

import { ciGetRoutesMatcher } from "@cloudigniter/core/lib";

import type { CiRoute, CiRoutesMap } from "@cloudigniter/core/types";

import { ciCreateRoute } from "./helpers";

interface CiHandleRouteLogicInput {
  request: NextRequest;

  /**
   * Logical application pathname after Tenant and Org Unit transport segments
   * have been removed.
   */
  pathnameNormalized: string;

  routes: CiRoutesMap;
}

type CiHandleRouteLogicResult =
  | {
      action: "route-info";
      route: null;
      details: {
        requestedPath: string;
        reason: "route-not-registered";
      };
    }
  | {
      action: "redirect";
      route: CiRoute;
      destination: URL;
    }
  | {
      action: "continue";
      route: CiRoute;
    };

/**
 * Resolves a same-origin application destination.
 *
 * Invalid, external, or malformed values fall back to the provided internal
 * pathname.
 */
function ciResolveSafeInternalUrl(value: string, request: NextRequest, fallbackPathname: string): URL {
  try {
    if (!value.startsWith("/")) {
      throw new Error("The destination is not an absolute application pathname.");
    }

    const destination = new URL(value, request.url);

    if (destination.origin !== request.nextUrl.origin) {
      throw new Error("The destination has a different origin.");
    }

    return destination;
  } catch {
    return new URL(fallbackPathname, request.url);
  }
}

/**
 * Determines whether the current request has an authenticated session.
 */
async function ciIsRequestAuthenticated(request: NextRequest): Promise<boolean> {
  const gateUrl = new URL("/ci-internal/auth/session", request.url);

  const sessionResponse = await fetch(gateUrl, {
    method: "POST",
    headers: {
      cookie: request.headers.get("cookie") ?? "",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      t: Date.now(),
    }),
    cache: "no-store",
  }).catch((error: unknown) => {
    console.error("[proxy] auth gate fetch failed:", error);

    return null;
  });

  return sessionResponse?.ok === true;
}

/**
 * Resolves the logical CloudIgniter route and evaluates its authentication and
 * canonical-navigation requirements.
 *
 * This function returns a routing decision only. Response creation, request
 * context serialization, headers, cookies, rewrites, and redirects are owned by
 * ciNextProxyResponse().
 */
export async function ciHandleRouteLogic({
  request,
  pathnameNormalized,
  routes,
}: CiHandleRouteLogicInput): Promise<CiHandleRouteLogicResult> {
  const routesMatcher = ciGetRoutesMatcher(routes);
  const routeMatch = routesMatcher.resolve(pathnameNormalized);

  if (!routeMatch) {
    return {
      action: "route-info",
      route: null,
      details: {
        requestedPath: pathnameNormalized,
        reason: "route-not-registered",
      },
    };
  }

  const route = ciCreateRoute({
    request,
    pathname: pathnameNormalized,
    match: routeMatch,
  });

  const isLoginPage = route.matchedPattern === "/login";
  const isLogoutRequest = route.matchedPattern === "/logout";

  /**
   * Canonicalize Tenant-aware logout paths:
   *
   * /tx/acme/logout -> /logout
   */
  if (isLogoutRequest && request.nextUrl.pathname !== route.pathname) {
    const logoutUrl = request.nextUrl.clone();

    logoutUrl.pathname = route.pathname;
    logoutUrl.search = "";

    return {
      action: "redirect",
      route,
      destination: logoutUrl,
    };
  }

  /*
   * Authentication is needed only when:
   *
   * - the route is protected; or
   * - the route is the login page and authenticated users must be redirected.
   */
  const authenticated = route.protected || isLoginPage ? await ciIsRequestAuthenticated(request) : false;

  if (route.protected && !authenticated) {
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/login";
    loginUrl.search = "";

    loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);

    return {
      action: "redirect",
      route,
      destination: loginUrl,
    };
  }

  if (isLoginPage && authenticated) {
    const rawNext = request.nextUrl.searchParams.get("next") ?? "/dashboard";

    return {
      action: "redirect",
      route,
      destination: ciResolveSafeInternalUrl(rawNext, request, "/dashboard"),
    };
  }

  return {
    action: "continue",
    route,
  };
}
