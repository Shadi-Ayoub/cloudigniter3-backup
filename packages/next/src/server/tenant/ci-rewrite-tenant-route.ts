import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ciNormalizePathname } from "@cloudigniter/core/lib";

import type { CiTenantContext } from "@cloudigniter/core/types";

/**
 * Rewrites a validated logical feature route to the internal Tenant or Global
 * application route while preserving forwarded request context headers.
 *
 * Examples:
 * - Tenant: /dashboard -> /ci-tenant/dashboard
 * - Global: /dashboard -> /ci-global/dashboard
 */
export function ciRewriteTenantRoute({
  request,
  response,
  requestHeaders,
  tenant,
  featurePathname,
}: {
  request: NextRequest;
  response: NextResponse;
  requestHeaders: Headers;
  tenant: CiTenantContext;
  featurePathname: string;
}): NextResponse {
  const routePathname = ciNormalizePathname(featurePathname);

  if (tenant.scope === "system") {
    return NextResponse.next({
      headers: response.headers,
      request: {
        headers: requestHeaders,
      },
    });
  }

  const internalRoot = tenant.scope === "global" ? "/ci-global" : "/ci-tenant";

  const rewriteUrl = request.nextUrl.clone();

  rewriteUrl.pathname =
    routePathname === "/" ? internalRoot : `${internalRoot}${routePathname}`;

  return NextResponse.rewrite(rewriteUrl, {
    headers: response.headers,
    request: {
      headers: requestHeaders,
    },
  });
}
