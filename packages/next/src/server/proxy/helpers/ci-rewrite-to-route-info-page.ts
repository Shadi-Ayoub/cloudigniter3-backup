import { NextResponse, type NextRequest } from "next/server";
import type { CiRouteInfoPageReason } from "@cloudigniter/core/types";

export function ciRewriteToRouteInfoPage(
  request: NextRequest,
  ctx: {
    /** The original normalized pathname that was rejected (e.g. "/x/y") */
    requestedPath: string;

    /** Optional: reason for info page rendering */
    reason?: CiRouteInfoPageReason;

    /** Optional: best-match pattern (debug / tracing only) */
    matchedPattern?: string | null;
  },
  opts: {
    /** Absolute pathname of the info page (e.g. "/info/invalid-route") */
    infoPagePath: string;

    /** rewrite (default) or redirect */
    infoPageStrategy?: "rewrite" | "redirect";
  },
  response?: NextResponse,
) {
  const url = request.nextUrl.clone();
  url.pathname = opts.infoPagePath;

  // Canonical info page: remove prior query parameters
  url.search = "";

  url.searchParams.set("path", ctx.requestedPath);

  if (ctx.reason) {
    url.searchParams.set("reason", ctx.reason);
  }

  if (ctx.matchedPattern) {
    url.searchParams.set("pattern", ctx.matchedPattern);
  }

  const r = response ?? NextResponse.next();
  const strategy = opts.infoPageStrategy ?? "rewrite";

  return strategy === "redirect"
    ? NextResponse.redirect(url, { headers: r.headers })
    : NextResponse.rewrite(url, { headers: r.headers });
}
