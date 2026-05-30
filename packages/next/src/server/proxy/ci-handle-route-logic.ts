import { NextRequest, NextResponse } from "next/server";
import {
  CI_DEFAULT_ROUTE_NAMESPACE_COOKIE_NAME,
  CI_DEFAULT_ROUTE_NAMESPACE_HEADER_NAME,
  CI_DEFAULT_ROUTE_PATHNAME_COOKIE_NAME,
  CI_DEFAULT_ROUTE_PATHNAME_HEADER_NAME,
  ciGetRoutesMatcher,
} from "@cloudigniter/core/lib";
import type {
  CiRouteRuntimeConfig,
  CiRoutesMap,
} from "@cloudigniter/core/types";
import { ciRewriteToRouteInfoPage } from "./helpers";

interface handlePathLogicInterface {
  request: NextRequest;
  response: NextResponse;
  pathnameNormalized: string;
  routeConfig: CiRouteRuntimeConfig;
  routes: CiRoutesMap;
}

/**
 * Proxy path handler that:
 *  - persists the normalized request pathname to both a cookie and a header
 *  - enforces an authentication gate for protected routes
 *  - normalizes login/logout navigation behavior
 *
 * What it does
 * ------------
 * This function is designed to be called from Next.js proxy as a single
 * “path + auth gate” step. It returns:
 *
 *   { response, exit }
 *
 * where `exit=true` means the proxy pipeline must stop because a
 * redirect response has already been produced.
 *
 * Responsibilities
 * ----------------
 * 1) Persist the current request path
 *    - Writes the normalized pathname into a cookie (default: CI_DEFAULT_PATH_COOKIE_NAME)
 *    - Writes the normalized pathname into a response header (default: CI_DEFAULT_PATH_HEADER_NAME)
 *
 *    Rationale:
 *    - The path cookie/header can be consumed later by server components, route handlers,
 *      or downstream proxy logic to:
 *        • know the original request path
 *        • support debugging/tracing
 *        • support "return-to" navigation and other request-context behaviors
 *
 * 2) Enforce a protected-route authentication gate
 *    - Determines whether the request is for a protected route using:
 *
 *        isProtectedPath(pathnameNormalized, routes)
 *
 *    - Resolves authentication state by calling an internal server endpoint:
 *
 *        POST /ci-internal/auth/session
 *
 *      with forwarded cookies to allow server-side session resolution.
 *
 *    - If the route is protected and the user is not authenticated:
 *      redirects to `/login` and includes a `next=` parameter that captures
 *      the original path + query + hash.
 *
 * 3) Handle logout routing explicitly
 *    - If the incoming request targets `/logout`, the function immediately
 *      returns a redirect response to `/logout` and stops the pipeline.
 *
 *    Notes:
 *    - This is typically used to force logout to be handled by a dedicated route
 *      handler/page (rather than allowing arbitrary logout-prefixed paths to proceed).
 *
 * 4) Prevent authenticated users from accessing the login page
 *    - If the user is already authenticated and requests `/login`:
 *      redirect them away (default to `/dashboard`).
 *
 *    - If a `next` query parameter exists, it is honored only if it is a safe
 *      relative path (must start with `/`), otherwise it falls back to `/dashboard`.
 *
 * Authentication gating endpoint contract
 * --------------------------------------
 * The endpoint `/ci-internal/auth/session` is expected to return:
 *   - HTTP 200 (ok) when the user is authenticated
 *   - non-200 when unauthenticated
 *
 * The proxy forwards cookies so the endpoint can evaluate the session.
 * A timestamp payload is included (`{ t: Date.now() }`) to defeat intermediary caching.
 *
 * Inputs
 * ------
 * request:
 *   The NextRequest being processed by proxy.
 *
 * response:
 *   A mutable NextResponse (often NextResponse.next()) that accumulates headers/cookies.
 *
 * pathnameNormalized:
 *   A normalized pathname (typically produced by your normalizePathname() utility).
 *   This is what gets persisted and evaluated against route protection rules.
 *
 * ciConfig:
 *   CloudIgniter runtime configuration; used here to resolve the cookie/header keys
 *   for persisting the path, with fallback to CI defaults.
 *
 * routes:
 *   Route registry used by isProtectedPath() to determine if the path requires auth.
 *
 * Outputs
 * -------
 * { response, exit }
 *
 * response:
 *   - The same response passed in (with path cookie/header applied), OR
 *   - a redirect response to /login, /logout, or a post-login destination.
 *
 * exit:
 *   - false  → caller should continue proxy processing and eventually return `response`
 *   - true → caller must stop and return the provided redirect response immediately
 *
 * Failure behavior
 * ----------------
 * If the auth gate fetch fails (network/runtime error), the function treats the user
 * as unauthenticated (`authenticated = false`). This is conservative and prevents
 * protected pages from being accessed during transient failures.
 *
 * Security notes
 * --------------
 * - The `next` parameter is sanitized to prevent open redirects (only allows paths
 *   beginning with `/`).
 * - Cookie is set with `sameSite: 'lax'` and path `'/'` to be broadly available while
 *   reducing CSRF exposure compared to `none`.
 */
export async function ciHandleRouteLogic({
  request,
  response,
  pathnameNormalized,
  routeConfig,
  routes,
}: handlePathLogicInterface) {
  let exit: boolean = false;

  const routesMatcher = ciGetRoutesMatcher(routes);
  const route = routesMatcher.resolve(pathnameNormalized);

  if (!route) {
    const r = ciRewriteToRouteInfoPage(
      request,
      {
        requestedPath: pathnameNormalized,
        reason: "route-not-registered",
      },
      {
        infoPagePath: "/info/invalid-route",
        infoPageStrategy: routeConfig.infoPageStrategy ?? "rewrite",
      },
      response,
    );

    return { response: r, exit: true };
  }

  // Set headers
  const routeNamespaceHeaderName =
    routeConfig.namespaceHeaderName ?? CI_DEFAULT_ROUTE_NAMESPACE_HEADER_NAME;
  const routePathnameHeaderName =
    routeConfig.pathnameHeaderName ?? CI_DEFAULT_ROUTE_PATHNAME_HEADER_NAME;
  response.headers.set(routeNamespaceHeaderName, pathnameNormalized);
  response.headers.set(routePathnameHeaderName, pathnameNormalized);

  // Set Cookies
  const routeNamespaceCookieName =
    routeConfig.namespaceCookieName ?? CI_DEFAULT_ROUTE_NAMESPACE_COOKIE_NAME;
  const routePathnameCookieName =
    routeConfig.pathnameCookieName ?? CI_DEFAULT_ROUTE_PATHNAME_COOKIE_NAME;
  response.cookies.set(routeNamespaceCookieName, route.namespace, {
    path: "/",
    sameSite: "lax",
  });
  response.cookies.set(routePathnameCookieName, pathnameNormalized, {
    path: "/",
    sameSite: "lax",
  });

  // Protected-path gate
  // logout handling
  const url = new URL(request.url);
  const isLoginPage = url.pathname.startsWith("/login");
  const isLogoutRequest = url.pathname.startsWith("/logout");

  if (isLogoutRequest) {
    const r = NextResponse.redirect(new URL("/logout"));
    return { response: r, exit: true };
  }

  const gateUrl = new URL("/ci-internal/auth/session", request.url);

  // fetch session from cookies (since on server)
  const resp = await fetch(gateUrl, {
    method: "POST",
    headers: {
      // ✅ forward cookies to Node route handler
      cookie: request.headers.get("cookie") ?? "",
      "content-type": "application/json",
    },
    body: JSON.stringify({ t: Date.now() }), // defeat any intermediary caching
    cache: "no-store",
  }).catch((e) => {
    console.error("[proxy] auth gate fetch failed:", e);
    return null;
  });

  const authenticated = resp?.ok;

  // const protectedPath = isProtectedPath(pathnameNormalized, routes);
  const protectedPath = routesMatcher.isProtected(pathnameNormalized);

  if (protectedPath && !authenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set(
      "next",
      request.nextUrl.pathname + request.nextUrl.search + request.nextUrl.hash,
    );
    const r = NextResponse.redirect(loginUrl);
    return { response: r, exit: true };
  }

  // handle login route while already logged in!
  if (isLoginPage && authenticated) {
    // Redirect authenticated users away from the login page
    console.log("[Proxy] Redirecting to Dashboard Page...");

    const rawNext = url.searchParams.get("next") || "/dashboard";
    const safeNext = rawNext.startsWith("/") ? rawNext : "/dashboard";
    const r = NextResponse.redirect(new URL(safeNext, request.url));
    return { response: r, exit: true };
  }

  return { response, exit };
}
