import type { NextRequest } from "next/server";
import { ciGetRouteSearchParams } from "@cloudigniter/core/lib";
import type { CiRoute, CiRouteMatch } from "@cloudigniter/core/types";

export function ciCreateRoute({
  request,
  pathname,
  match,
}: {
  request: NextRequest;
  pathname: string;
  match: CiRouteMatch;
}): CiRoute {
  const publicPathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;

  return {
    ...match.definition,

    pathname,
    publicPathname,
    matchedPattern: match.matchedPattern,
    matchKind: match.matchKind,
    wildcardPath: match.wildcardPath,

    search,
    requestTarget: `${publicPathname}${search}`,
    searchParams: ciGetRouteSearchParams(request.nextUrl.searchParams),
  };
}
