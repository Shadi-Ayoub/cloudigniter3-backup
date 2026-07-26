import { NextResponse, type NextRequest } from "next/server";

import type { CiRouteInfoPageReason } from "@cloudigniter/core/types";

function ciGetForwardedResponseHeaders(response?: NextResponse): Headers {
  const headers = new Headers(response?.headers);

  /*
   * Remove control headers belonging to the previous NextResponse.
   * The replacement rewrite or redirect generates its own control headers.
   *
   * Preserve x-middleware-set-cookie because it carries cookies accumulated
   * earlier in the proxy pipeline.
   */
  headers.delete("x-middleware-next");
  headers.delete("x-middleware-rewrite");
  headers.delete("x-middleware-override-headers");
  headers.delete("location");

  /*
   * These headers are generated internally when NextResponse.next() or
   * NextResponse.rewrite() receives request-header overrides.
   */
  const requestOverrideHeaders: string[] = [];

  headers.forEach((_value, name) => {
    if (name.startsWith("x-middleware-request-")) {
      requestOverrideHeaders.push(name);
    }
  });

  for (const name of requestOverrideHeaders) {
    headers.delete(name);
  }

  return headers;
}

export function ciRewriteToRouteInfoPage(
  request: NextRequest,
  ctx: {
    /** Original normalized pathname that was rejected. */
    requestedPath: string;

    /** Reason for rendering the route information page. */
    reason?: CiRouteInfoPageReason;

    /** Best-matching route pattern, used for diagnostics. */
    matchedPattern?: string | null;
  },
  opts: {
    /** Absolute pathname of the information page. */
    infoPagePath: string;

    /** Rewrite by default, or issue a browser redirect. */
    infoPageStrategy?: "rewrite" | "redirect";
  },
  response?: NextResponse,

  /**
   * Additional request headers accumulated by earlier proxy steps,
   * such as Tenant, Org Unit, and route-context headers.
   */
  requestHeaders?: Headers,
): NextResponse {
  const url = request.nextUrl.clone();

  url.pathname = opts.infoPagePath;
  url.search = "";

  url.searchParams.set("path", ctx.requestedPath);

  if (ctx.reason) {
    url.searchParams.set("reason", ctx.reason);
  }

  if (ctx.matchedPattern) {
    url.searchParams.set("pattern", ctx.matchedPattern);
  }

  const responseHeaders = ciGetForwardedResponseHeaders(response);
  const strategy = opts.infoPageStrategy ?? "rewrite";

  /*
   * A redirect starts a new browser request. Request headers cannot be
   * forwarded to that new request, but response headers and cookies are kept.
   */
  if (strategy === "redirect") {
    return NextResponse.redirect(url, {
      headers: responseHeaders,
    });
  }

  /*
   * Start with the original request headers and overlay the authoritative
   * headers accumulated by earlier proxy stages.
   */
  const forwardedRequestHeaders = new Headers(request.headers);

  requestHeaders?.forEach((value, name) => {
    forwardedRequestHeaders.set(name, value);
  });

  return NextResponse.rewrite(url, {
    headers: responseHeaders,
    request: {
      headers: forwardedRequestHeaders,
    },
  });
}
